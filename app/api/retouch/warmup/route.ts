import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createPredictionWithRateLimit } from '@/lib/replicatePredictions';

export const runtime = 'nodejs';
export const maxDuration = 60;

const CODEFORMER_FALLBACK = '7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56';

// GET /api/retouch/warmup
// 웜업 prediction은 저크레딧 계정의 burst 제한을 소모하므로 기본 비활성화
export async function GET() {
  try {
    if (process.env.ENABLE_REPLICATE_WARMUP !== 'true') {
      return NextResponse.json({ ok: true, skipped: true });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ ok: false });
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    let versionId = CODEFORMER_FALLBACK;
    try {
      const info = await replicate.models.get('sczhou', 'codeformer');
      versionId = info.latest_version?.id ?? CODEFORMER_FALLBACK;
    } catch { /* fallback 사용 */ }

    // 필요할 때만 웜업용 더미 예측 생성 (결과를 기다리지 않음)
    await createPredictionWithRateLimit(replicate, {
      version: versionId,
      input: {
        // 공개 테스트 이미지로 모델 로드만 트리거
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Gatto_europeo4.jpg/320px-Gatto_europeo4.jpg',
        codeformer_fidelity: 0.7,
        background_enhance: false,
        face_upsample: false,
        upscale: 1,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    // 웜업 실패해도 사용자에게 영향 없음
    return NextResponse.json({ ok: false });
  }
}
