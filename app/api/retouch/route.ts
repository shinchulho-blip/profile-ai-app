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
export const maxDuration = 60;

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
      return NextResponse.json(
        { success: false, error: 'publicId와 projectName이 필요합니다.' },
        { status: 400 }
      );
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!process.env.REPLICATE_API_TOKEN || !cloudName) {
      return NextResponse.json(
        { success: false, error: '서버 환경변수가 누락되었습니다.' },
        { status: 500 }
      );
    }

    // ── 1. 원본 이미지 URL ───────────────────────────────────
    const originalUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;

    // ── 2. 프롬프트 & 크기 ───────────────────────────────────
    const prompt         = buildPositivePrompt(options);
    const negativePrompt = buildNegativePrompt(options);
    const promptStrength = getPromptStrength(options.strength);
    const { width, height } = getCropDimensions(options.cropRatio);

    // ── 3. Replicate: 최신 버전 동적 조회 후 실행 ───────────
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    // stability-ai/sdxl 은 버전 해시 없이 호출하면 404 발생
    // → models.get() 으로 최신 버전 ID를 동적으로 가져온다
    const modelInfo = await replicate.models.get('stability-ai', 'sdxl');
    const versionId = modelInfo.latest_version?.id;

    if (!versionId) {
      throw new Error('SDXL 모델 버전 정보를 가져올 수 없습니다.');
    }

    const output = await replicate.run(
      `stability-ai/sdxl:${versionId}`,
      {
        input: {
          image:               originalUrl,
          prompt,
          negative_prompt:     negativePrompt,
          prompt_strength:     promptStrength,
          num_inference_steps: 25,        // 40→25: GPU 메모리 절약
          guidance_scale:      7.5,
          width,
          height,
          refine:              'no_refiner', // expert_ensemble_refiner → OOM
          scheduler:           'K_EULER',
        },
      }
    ) as string[];

    if (!output || output.length === 0) {
      throw new Error('AI 처리 결과가 비어 있습니다.');
    }

    const retouchedUrl = output[0];

    // ── 4. Cloudinary enhanced 폴더에 저장 ──────────────────
    const enhancedFolder = getEnhancedFolder(projectName);
    const baseName = (filename ?? publicId.split('/').pop() ?? 'photo')
      .replace(/\.[^.]+$/, '');

    const uploaded = await cloudinary.uploader.upload(retouchedUrl, {
      folder:        enhancedFolder,
      public_id:     baseName,
      overwrite:     true,
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
