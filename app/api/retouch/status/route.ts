import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import sharp from 'sharp';
import type { UploadApiResponse } from 'cloudinary';
import cloudinary, { getEnhancedFolder } from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const maxDuration = 60; // AI 결과 다운로드/압축/업로드까지 처리

const CLOUDINARY_UPLOAD_LIMIT_BYTES = 10 * 1024 * 1024;
const TARGET_UPLOAD_BYTES = 9 * 1024 * 1024;
const JPEG_QUALITIES = [88, 82, 76, 70, 64, 58];
const MAX_IMAGE_DIMENSIONS = [2200, 1800, 1400, 1200];

// 에러 객체를 안전하게 문자열로 변환
function safeMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  try { return JSON.stringify(e); } catch { return '알 수 없는 오류'; }
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`AI 결과 이미지 다운로드 실패 (${response.status})`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function makeCloudinarySafeImage(url: string): Promise<Buffer> {
  const original = await downloadImage(url);
  if (original.byteLength <= TARGET_UPLOAD_BYTES) {
    return original;
  }

  let fallback: Buffer | null = null;
  for (const maxDimension of MAX_IMAGE_DIMENSIONS) {
    for (const quality of JPEG_QUALITIES) {
      const compressed = await sharp(original, { failOn: 'none' })
        .rotate()
        .resize({
          width: maxDimension,
          height: maxDimension,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();

      fallback = compressed;
      if (compressed.byteLength <= TARGET_UPLOAD_BYTES) {
        return compressed;
      }
    }
  }

  if (fallback && fallback.byteLength <= CLOUDINARY_UPLOAD_LIMIT_BYTES) {
    return fallback;
  }

  throw new Error('AI 결과 이미지가 Cloudinary 업로드 제한보다 큽니다. 더 작은 원본으로 다시 시도해 주세요.');
}

function uploadImageBuffer(
  image: Buffer,
  options: {
    folder: string;
    publicId: string;
  }
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.publicId,
        overwrite: true,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error('Cloudinary 업로드 결과가 없습니다.'));
          return;
        }
        resolve(result);
      }
    );

    stream.end(image);
  });
}

// GET /api/retouch/status?id=xxx&publicId=yyy&projectName=zzz&filename=aaa
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const predictionId = searchParams.get('id');
    const publicId     = searchParams.get('publicId') ?? '';
    const projectName  = searchParams.get('projectName') ?? '';
    const filename     = searchParams.get('filename') ?? '';

    if (!predictionId) {
      return NextResponse.json({ success: false, error: 'predictionId가 없습니다.' }, { status: 400 });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ success: false, error: 'REPLICATE_API_TOKEN 누락' }, { status: 500 });
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const prediction = await replicate.predictions.get(predictionId);

    // 아직 처리 중
    if (prediction.status === 'starting' || prediction.status === 'processing') {
      return NextResponse.json({ success: true, status: prediction.status });
    }

    // 실패 — prediction.error가 객체일 수 있으므로 safeMsg 사용
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      const errMsg = prediction.error ? safeMsg(prediction.error) : prediction.status;
      return NextResponse.json({
        success: false,
        error: `AI 처리 실패: ${errMsg}`,
      });
    }

    // 성공 → Cloudinary에 저장
    if (prediction.status === 'succeeded') {
      const rawOutput = prediction.output;
      const outputUrl = typeof rawOutput === 'string'
        ? rawOutput
        : Array.isArray(rawOutput) ? rawOutput[0] : null;

      if (!outputUrl) {
        return NextResponse.json({ success: false, error: 'AI 결과 URL이 없습니다.' });
      }

      const enhancedFolder = getEnhancedFolder(projectName);
      const baseName = (filename || publicId.split('/').pop() || 'photo').replace(/\.[^.]+$/, '');

      const uploadImage = await makeCloudinarySafeImage(outputUrl as string);
      const uploaded = await uploadImageBuffer(uploadImage, {
        folder: enhancedFolder,
        publicId: baseName,
      });

      return NextResponse.json({
        success: true,
        status:  'succeeded',
        data: {
          publicId: uploaded.public_id,
          url:      uploaded.secure_url,
          width:    uploaded.width,
          height:   uploaded.height,
          bytes:    uploaded.bytes,
        },
      });
    }

    return NextResponse.json({ success: false, error: `알 수 없는 상태: ${prediction.status}` });

  } catch (error: unknown) {
    const message = safeMsg(error);
    console.error('[GET /api/retouch/status]', message);
    return NextResponse.json({ success: false, error: `상태 확인 실패: ${message}` }, { status: 500 });
  }
}
