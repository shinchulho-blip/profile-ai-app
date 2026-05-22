import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { type RetouchOptions } from '@/lib/prompts';

export const runtime = 'nodejs';
export const maxDuration = 15; // 예측 생성만 하므로 15초면 충분

// CodeFormer 알려진 안정 버전 (fallback용)
const CODEFORMER_FALLBACK = '7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56';

function getFidelity(strength: RetouchOptions['strength']): number {
  return { natural: 0.8, standard: 0.65, polished: 0.5 }[strength];
}

// POST /api/retouch — 예측 시작만 하고 즉시 반환 (타임아웃 방지)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      publicId: string;
      projectName: string;
      filename: string;
      options: RetouchOptions;
    };

    const { publicId, options } = body;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!process.env.REPLICATE_API_TOKEN || !cloudName) {
      return NextResponse.json({ success: false, error: '서버 환경변수가 누락되었습니다.' }, { status: 500 });
    }

    const originalUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    // 모델 버전 동적 조회 (실패 시 fallback 사용)
    let versionId = CODEFORMER_FALLBACK;
    try {
      const info = await replicate.models.get('sczhou', 'codeformer');
      versionId = info.latest_version?.id ?? CODEFORMER_FALLBACK;
    } catch { /* fallback 사용 */ }

    // 예측 시작 (완료를 기다리지 않음)
    const prediction = await replicate.predictions.create({
      version: versionId,
      input: {
        image:               originalUrl,
        codeformer_fidelity: getFidelity(options.strength),
        background_enhance:  false,
        face_upsample:       false,  // true→false: 속도 개선
        upscale:             1,      // 2→1: 속도 개선 (업스케일 제거)
      },
    });

    return NextResponse.json({ success: true, predictionId: prediction.id });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[POST /api/retouch]', message);
    return NextResponse.json({ success: false, error: `보정 시작 실패: ${message}` }, { status: 500 });
  }
}
