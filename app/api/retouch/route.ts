import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import cloudinary, { getEnhancedFolder } from '@/lib/cloudinary';
import {
  buildPositivePrompt,
  buildNegativePrompt,
  getPromptStrength,
  getCropDimensions,
  type RetouchOptions,
} from '@/lib/prompts';

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel Hobby 최대 60초

// Replicate SDXL img2img 모델
// 사실적인 인물 사진 보정에 최적화된 안정적 모델
const MODEL_VERSION = 'stability-ai/sdxl:39ed52f2319f9bf9f13d29a46dc57f9d';

// POST /api/retouch — AI 보정 실행
// 예상 처리 시간: natural 15~25s / standard 20~35s / polished 25~45s
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

    // ── 1. 원본 이미지 URL 구성 ─────────────────────────────
    const originalUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;

    // ── 2. 프롬프트 조립 ─────────────────────────────────────
    const prompt         = buildPositivePrompt(options);
    const negativePrompt = buildNegativePrompt(options);
    const promptStrength = getPromptStrength(options.strength);
    const { width, height } = getCropDimensions(options.cropRatio);

    // ── 3. Replicate 호출 ─────────────────────────────────────
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    const output = await replicate.run(MODEL_VERSION, {
      input: {
        image: originalUrl,
        prompt,
        negative_prompt: negativePrompt,
        prompt_strength: promptStrength,
        num_inference_steps: 40,
        guidance_scale: 7.5,
        width,
        height,
        refine: 'expert_ensemble_refiner',
        high_noise_frac: 0.8,
        scheduler: 'K_EULER',
      },
    }) as string[];

    if (!output || output.length === 0) {
      return NextResponse.json({ success: false, error: 'AI 보정 결과가 없습니다.' }, { status: 500 });
    }

    const retouchedUrl = Array.isArray(output) ? output[0] : output;

    // ── 4. 결과를 Cloudinary enhanced 폴더에 저장 ───────────
    const enhancedFolder = getEnhancedFolder(projectName);
    const baseName = (filename ?? publicId.split('/').pop() ?? 'photo').replace(/\.[^.]+$/, '');

    const uploaded = await cloudinary.uploader.upload(retouchedUrl as string, {
      folder: enhancedFolder,
      public_id: baseName,
      overwrite: true,
      resource_type: 'image',
    });

    return NextResponse.json({
      success: true,
      data: {
        publicId:  uploaded.public_id,
        url:       uploaded.secure_url,
        width:     uploaded.width,
        height:    uploaded.height,
        bytes:     uploaded.bytes,
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
