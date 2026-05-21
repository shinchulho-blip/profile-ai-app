import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import cloudinary, { getEnhancedFolder } from '@/lib/cloudinary';
import {
  buildPositivePrompt,
  buildNegativePrompt,
  getImageGuidanceScale,
  type RetouchOptions,
} from '@/lib/prompts';

export const runtime = 'nodejs';
export const maxDuration = 60;

// instruct-pix2pix: 텍스트 지시어로 이미지를 편집하는 모델
// 버전 없이 모델명만 사용 → Replicate가 최신 버전 자동 선택
const MODEL = 'timothybrooks/instruct-pix2pix';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      publicId: string;
      projectName: string;
      filename: string;
      options: RetouchOptions;
    };

    const { publicId, projectName, filename, options } = body;

    if (!publicId || !projectName) {
      return NextResponse.json({ success: false, error: 'publicId와 projectName이 필요합니다.' }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!process.env.REPLICATE_API_TOKEN || !cloudName) {
      return NextResponse.json({ success: false, error: '서버 환경변수가 누락되었습니다.' }, { status: 500 });
    }

    // ── 1. 원본 이미지 URL ───────────────────────────────────
    const originalUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;

    // ── 2. 프롬프트 조립 ─────────────────────────────────────
    const prompt            = buildPositivePrompt(options);
    const negativePrompt    = buildNegativePrompt(options);
    // instruct-pix2pix의 image_guidance_scale:
    //   높을수록 원본을 더 보존 (natural=2.0, standard=1.5, polished=1.1)
    const imageGuidanceScale = getImageGuidanceScale(options.strength);

    // ── 3. Replicate 호출 ─────────────────────────────────────
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    // Replicate API로 예측 생성 (버전은 API가 자동 해결)
    const prediction = await replicate.predictions.create({
      model: MODEL,
      input: {
        image:               originalUrl,
        prompt,
        negative_prompt:     negativePrompt,
        num_inference_steps: 100,
        image_guidance_scale: imageGuidanceScale,
        guidance_scale:      7.5,
      },
    });

    // 완료까지 폴링 (최대 55초)
    const result = await replicate.wait(prediction, { interval: 3000 });

    if (result.status === 'failed' || !result.output) {
      throw new Error(result.error ? String(result.error) : 'AI 처리 실패');
    }

    const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;

    // ── 4. 결과를 Cloudinary enhanced 폴더에 저장 ───────────
    const enhancedFolder = getEnhancedFolder(projectName);
    const baseName = (filename ?? publicId.split('/').pop() ?? 'photo').replace(/\.[^.]+$/, '');

    const uploaded = await cloudinary.uploader.upload(outputUrl as string, {
      folder: enhancedFolder,
      public_id: baseName,
      overwrite: true,
      resource_type: 'image',
    });

    return NextResponse.json({
      success: true,
      data: {
        publicId:       uploaded.public_id,
        url:            uploaded.secure_url,
        width:          uploaded.width,
        height:         uploaded.height,
        bytes:          uploaded.bytes,
        appliedOptions: options,
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[POST /api/retouch]', message);
    return NextResponse.json(
      { success: false, error: `AI 보정 처리 실패: ${message}` },
      { status: 500 }
    );
  }
}
