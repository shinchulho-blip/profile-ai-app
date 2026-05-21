import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import cloudinary, { getEnhancedFolder } from '@/lib/cloudinary';
import {
  buildPositivePrompt,
  buildNegativePrompt,
  getPromptStrength,
  type RetouchOptions,
} from '@/lib/prompts';

export const runtime = 'nodejs';
export const maxDuration = 60;

// SD 1.5 img2img 모델 — SDXL 대비 VRAM ~70% 절약 (~4-6GB)
// SDXL은 공유 GPU에서 CUDA OOM 발생 → SD 1.5로 교체
const MODEL_OWNER = 'stability-ai';
const MODEL_NAME  = 'stable-diffusion-img2img';

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

    // ── 2. 프롬프트 조립 ─────────────────────────────────────
    const prompt         = buildPositivePrompt(options);
    const negativePrompt = buildNegativePrompt(options);
    const promptStrength = getPromptStrength(options.strength);

    // ── 3. 모델 버전 동적 조회 ───────────────────────────────
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    const modelInfo = await replicate.models.get(MODEL_OWNER, MODEL_NAME);
    const versionId = modelInfo.latest_version?.id;

    if (!versionId) {
      throw new Error(`${MODEL_NAME} 모델 버전을 가져올 수 없습니다.`);
    }

    // ── 4. Replicate 실행 ────────────────────────────────────
    // SD 1.5 img2img: 512~768px 최적, VRAM 4-6GB 소요
    const output = await replicate.run(
      `${MODEL_OWNER}/${MODEL_NAME}:${versionId}`,
      {
        input: {
          image:               originalUrl,
          prompt,
          negative_prompt:     negativePrompt,
          prompt_strength:     promptStrength,
          num_inference_steps: 30,
          guidance_scale:      7.5,
          width:               512,
          height:              512,
          scheduler:           'K_EULER',
        },
      }
    ) as string[];

    if (!output || output.length === 0) {
      throw new Error('AI 처리 결과가 비어 있습니다.');
    }

    const retouchedUrl = output[0];

    // ── 5. Cloudinary enhanced 폴더에 저장 ──────────────────
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
