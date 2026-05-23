import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { type RetouchOptions } from '@/lib/prompts';
import {
  createPredictionWithRateLimit,
  isRateLimitError,
  safeMsg,
} from '@/lib/replicatePredictions';

export const runtime = 'nodejs';
export const maxDuration = 60; // 저크레딧 계정의 429 재시도/대기 시간을 포함

// CodeFormer 알려진 안정 버전 (fallback용)
const CODEFORMER_FALLBACK = '7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56';

function getFidelity(strength: RetouchOptions['strength']): number {
  // Higher fidelity keeps the original facial structure and reduces AI artifacts
  // such as bright nostril patches or unnaturally deep under-eye shadows.
  return { natural: 0.96, standard: 0.91, polished: 0.86 }[strength];
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

    // 모델 버전 동적 조회 (fallback 사용)
    let versionId = CODEFORMER_FALLBACK;
    try {
      const info = await replicate.models.get('sczhou', 'codeformer');
      versionId = info.latest_version?.id ?? CODEFORMER_FALLBACK;
    } catch { /* fallback 사용 */ }

    // 예측 생성 (429 발생 시 자동 재시도, 최대 3회)
    const input = {
      image:               originalUrl,
      codeformer_fidelity: getFidelity(options.strength),
      background_enhance:  false,
      face_upsample:       false,
      upscale:             1,
    };

    const prediction = await createPredictionWithRateLimit(replicate, { version: versionId, input });

    return NextResponse.json({ success: true, predictionId: prediction.id });

  } catch (error: unknown) {
    const message = safeMsg(error);
    console.error('[POST /api/retouch]', message);
    if (isRateLimitError(error, message)) {
      return NextResponse.json(
        {
          success: false,
          error: '현재 Replicate 요청 제한에 걸렸습니다. 크레딧이 $5 미만이면 AI 보정 시작이 10초에 1장 정도로 제한됩니다. 잠시 후 다시 시도해 주세요.',
        },
        { status: 429 }
      );
    }

    return NextResponse.json({ success: false, error: `보정 시작 실패: ${message}` }, { status: 500 });
  }
}
