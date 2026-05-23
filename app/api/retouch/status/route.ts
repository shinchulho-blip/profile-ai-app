import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import sharp from 'sharp';
import type { UploadApiResponse } from 'cloudinary';
import cloudinary, { getEnhancedFolder } from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const maxDuration = 60;

const CLOUDINARY_UPLOAD_LIMIT_BYTES = 10 * 1024 * 1024;
const TARGET_UPLOAD_BYTES = 9 * 1024 * 1024;
const JPEG_QUALITIES = [92, 88, 82, 76, 70, 64];
const MAX_IMAGE_DIMENSIONS = [1800, 1600, 1400, 1200];

function safeMsg(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try { return JSON.stringify(error); } catch { return '알 수 없는 오류'; }
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`AI 결과 이미지 다운로드 실패 (${response.status})`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function makeCloudinarySafeImage(url: string): Promise<Buffer> {
  const image = await downloadImage(url);
  const normalized = await sharp(image, { failOn: 'none' })
    .rotate()
    .toColorspace('srgb')
    .jpeg({ quality: JPEG_QUALITIES[0], mozjpeg: true })
    .toBuffer();

  if (normalized.byteLength <= TARGET_UPLOAD_BYTES) {
    return normalized;
  }

  let fallback: Buffer | null = null;
  for (const maxDimension of MAX_IMAGE_DIMENSIONS) {
    for (const quality of JPEG_QUALITIES) {
      const compressed = await sharp(normalized, { failOn: 'none' })
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
        invalidate: true,
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

    if (prediction.status === 'starting' || prediction.status === 'processing') {
      return NextResponse.json({ success: true, status: prediction.status });
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled' || prediction.status === 'aborted') {
      const errMsg = prediction.error ? safeMsg(prediction.error) : prediction.status;
      return NextResponse.json({
        success: false,
        error: `AI 처리 실패: ${errMsg}`,
      });
    }

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
        publicId: `natural-profile-retouch-${baseName}`,
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
