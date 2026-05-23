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

const CODEFORMER_FALLBACK = 'cc4956dd26fa5a7185d5660cc9100fab1b8070a1d1654a8bb5eb6d443b020bb2';
const GFPGAN_VERSION = '0fbacf7afc6c144e5be9767cff80f25aff23e52b0708f17e20f9879b2f21516c';
const RETOUCH_MODEL = process.env.RETOUCH_MODEL ?? 'codeformer';

function getFidelity(strength: RetouchOptions['strength']): number {
  // Lower values edit more aggressively to create visible, beautiful differences.
  return { natural: 0.85, standard: 0.70, polished: 0.50 }[strength];
}

function getGfpganWeight(strength: RetouchOptions['strength']): number {
  // Higher weight favors identity; keep values conservative for profile photos.
  return { natural: 0.9, standard: 0.8, polished: 0.7 }[strength];
}

function getModelInputUrl(cloudName: string, publicId: string): string {
  // Bake EXIF orientation into the pixels before the model reads the image.
  // Browsers often honor EXIF orientation, but model APIs may not.
  return `https://res.cloudinary.com/${cloudName}/image/upload/a_auto,q_auto:best,f_jpg/${publicId}`;
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

    const originalUrl = getModelInputUrl(cloudName, publicId);
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    if (RETOUCH_MODEL === 'codeformer') {
      let versionId = CODEFORMER_FALLBACK;
      try {
        const info = await replicate.models.get('sczhou', 'codeformer');
        versionId = info.latest_version?.id ?? CODEFORMER_FALLBACK;
      } catch { /* fallback 사용 */ }

      const prediction = await createPredictionWithRateLimit(replicate, {
        version: versionId,
        input: {
          image:                originalUrl,
          codeformer_fidelity:  getFidelity(options.strength),
          background_enhance:   false,
          face_upsample:        false,
          upscale:              1,
        },
      });

      return NextResponse.json({ success: true, predictionId: prediction.id });
    }

    // GFPGAN is a face restoration/enhancement model, not a generative portrait rewrite.
    const prediction = await createPredictionWithRateLimit(replicate, {
      version: GFPGAN_VERSION,
      input: {
        img:     originalUrl,
        version: 'v1.4',
        scale:   1,
        weight:  getGfpganWeight(options.strength),
      },
    });

    return NextResponse.json({ success: true, predictionId: prediction.id });

  } catch (error: unknown) {
    const message = safeMsg(error);
    console.error('[POST /api/retouch]', message);
    if (isRateLimitError(error, message)) {
      return NextResponse.json(
        {
          success: false,
          error: '현재 Replicate 요청 제한에 걸렸습니다. 크레딧이 $5 미만이면 프로필 보정 시작이 10초에 1장 정도로 제한됩니다. 잠시 후 다시 시도해 주세요.',
        },
        { status: 429 }
      );
    }

    return NextResponse.json({ success: false, error: `보정 시작 실패: ${message}` }, { status: 500 });
  }
}
