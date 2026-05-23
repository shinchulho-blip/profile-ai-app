import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 10;

// GET /api/retouch/warmup
// FLUX Kontext Pro is a paid image-edit model, so warmup predictions are disabled.
export async function GET() {
  return NextResponse.json({ ok: true, skipped: true });
}
