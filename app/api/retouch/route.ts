import { NextRequest, NextResponse } from 'next/server';
import Replicate, { type Prediction } from 'replicate';
import { type RetouchOptions } from '@/lib/prompts';

export const runtime = 'nodejs';
export const maxDuration = 30; // 429 재시도 대기 시간을 포함

// CodeFormer 알려진 안정 버전 (fallback용)
const CODEFORMER_FALLBACK = '7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56';
const MAX_CREATE_ATTEMPTS = 3;
const MAX_RETRY_DELAY_MS = 8000;

function getFidelity(strength: RetouchOptions['strength']): number {
  return { natural: 0.8, standard: 0.65, polished: 0.5 }[strength];
}

function safeMsg(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try { return JSON.stringify(error); } catch { return '알 수 없는 오류'; }
}

function isRateLimitError(error: unknown, message: string): boolean {
  if (message.includes('429') || /rate limit/i.test(message)) return true;
  if (!error || typeof error !== 'object') return false;

  const record = error as Record<string, unknown>;
  return record.status === 429 || record.statusCode === 429;
}

function getRetryDelayMs(error: unknown, message: string): number {
  const retryAfter = error && typeof error === 'object'
    ? Number((error as Record<string, unknown>).retry_after)
    : NaN;
  const parsedSeconds = Number.isFinite(retryAfter)
    ? retryAfter
    : Number(
        message.match(/retry[_-]?after["':\s]+(\d+)/i)?.[1]
        ?? message.match(/~?(\d+)s/i)?.[1]
      );

  const delaySeconds = Number.isFinite(parsedSeconds) ? parsedSeconds + 1 : 4;
  return Math.min(delaySeconds * 1000, MAX_RETRY_DELAY_MS);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

    let prediction: Prediction | undefined;
    for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt++) {
      try {
        prediction = await replicate.predictions.create({ version: versionId, input });
        break; // 성공
      } catch (err: unknown) {
        const msg = safeMsg(err);
        if (isRateLimitError(err, msg) && attempt < MAX_CREATE_ATTEMPTS - 1) {
          await sleep(getRetryDelayMs(err, msg));
          continue;
        }
        throw err;
      }
    }

    if (!prediction) throw new Error('예측 생성 실패');
    return NextResponse.json({ success: true, predictionId: prediction.id });

  } catch (error: unknown) {
    const message = safeMsg(error);
    console.error('[POST /api/retouch]', message);
    return NextResponse.json({ success: false, error: `보정 시작 실패: ${message}` }, { status: 500 });
  }
}
