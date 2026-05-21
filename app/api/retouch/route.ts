import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import cloudinary, { getEnhancedFolder } from '@/lib/cloudinary';
import { type RetouchOptions } from '@/lib/prompts';

export const runtime = 'nodejs';
export const maxDuration = 60;

// CodeFormer: 인물 얼굴 복원·보정 전문 모델
// - VRAM ~3-4GB (SDXL 대비 80% 절약)
// - 자연스러운 피부 보정, 눈 선명화, 전반적 품질 향상
const MODEL_OWNER = 'sczhou';
const MODEL_NAME  = 'codeformer';

// codeformer_fidelity: 높을수록 원본 보존 (1.0=원본, 0.0=최대보정)
function getFidelity(strength: RetouchOptions['strength']): number {
  return { natural: 0.8, standard: 0.65, polished: 0.5 }[strength];
}

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

    // ── 2. 강도 매핑 ─────────────────────────────────────────
    const fidelity = getFidelity(options.strength);

    // ── 3. CodeFormer 모델 버전 동적 조회 ────────────────────
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    let versionId: string;
    try {
      const modelInfo = await replicate.models.get(MODEL_OWNER, MODEL_NAME);
      versionId = modelInfo.latest_version?.id ?? '';
      if (!versionId) throw new Error('버전 없음');
    } catch {
      // 조회 실패 시 알려진 안정 버전 사용
      versionId = '7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56';
    }

    // ── 4. Replicate 실행 ────────────────────────────────────
    const output = await replicate.run(
      `${MODEL_OWNER}/${MODEL_NAME}:${versionId}`,
      {
        input: {
          image:                originalUrl,
          codeformer_fidelity:  fidelity,  // 원본 보존도
          background_enhance:   false,      // 배경은 유지
          face_upsample:        true,       // 얼굴 선명화
          upscale:              2,          // 2배 업스케일
        },
      }
    ) as unknown;

    const retouchedUrl = typeof output === 'string'
      ? output
      : (output as string[])[0];
    if (!retouchedUrl) throw new Error('AI 처리 결과가 비어 있습니다.');

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
