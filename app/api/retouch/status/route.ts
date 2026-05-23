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
const RETOUCH_OUTPUT_QUALITY = 92;
const ORIGINAL_BLEND_OPACITY = 0.28;
const BACKGROUND_CLEANUP_OPACITY = 0.7;
const DEFAULT_SMILE_INTENSITY = 2;

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

async function downloadOptionalImage(url: string): Promise<Buffer | null> {
  try {
    return await downloadImage(url);
  } catch {
    return null;
  }
}

function buildBackgroundCleanupMask(width: number, height: number): Buffer {
  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <mask id="cleanup-mask">
          <rect width="100%" height="100%" fill="white"/>
          <ellipse cx="${width * 0.5}" cy="${height * 0.46}" rx="${width * 0.37}" ry="${height * 0.48}" fill="black"/>
          <rect x="${width * 0.24}" y="${height * 0.74}" width="${width * 0.52}" height="${height * 0.26}" fill="black"/>
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="white" mask="url(#cleanup-mask)"/>
    </svg>
  `);
}

async function reduceBackgroundStrayHairs(image: Buffer): Promise<Buffer> {
  const metadata = await sharp(image, { failOn: 'none' }).metadata();
  const { width, height } = metadata;

  if (!width || !height) {
    return image;
  }

  // Clean only the outer background so nose, under-eye detail, hair mass, and shoulders stay sharp.
  const cleanedBackground = await sharp(image, { failOn: 'none' })
    .median(3)
    .blur(1.1)
    .ensureAlpha(BACKGROUND_CLEANUP_OPACITY)
    .png()
    .toBuffer();
  const maskedCleanup = await sharp(cleanedBackground, { failOn: 'none' })
    .composite([{ input: buildBackgroundCleanupMask(width, height), blend: 'dest-in' }])
    .png()
    .toBuffer();

  return sharp(image, { failOn: 'none' })
    .composite([{ input: maskedCleanup, blend: 'over' }])
    .jpeg({ quality: RETOUCH_OUTPUT_QUALITY, mozjpeg: true })
    .toBuffer();
}

function normalizeSmileIntensity(value: string | null): 1 | 2 | 3 {
  const parsed = Number(value);
  if (parsed === 1 || parsed === 2 || parsed === 3) return parsed;
  return DEFAULT_SMILE_INTENSITY;
}

function sampleBilinear(data: Buffer, width: number, height: number, channels: number, x: number, y: number, channel: number): number {
  const x0 = Math.max(0, Math.min(width - 1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(height - 1, Math.floor(y)));
  const x1 = Math.max(0, Math.min(width - 1, x0 + 1));
  const y1 = Math.max(0, Math.min(height - 1, y0 + 1));
  const wx = x - x0;
  const wy = y - y0;

  const topLeft = data[(y0 * width + x0) * channels + channel];
  const topRight = data[(y0 * width + x1) * channels + channel];
  const bottomLeft = data[(y1 * width + x0) * channels + channel];
  const bottomRight = data[(y1 * width + x1) * channels + channel];
  const top = topLeft * (1 - wx) + topRight * wx;
  const bottom = bottomLeft * (1 - wx) + bottomRight * wx;

  return Math.round(top * (1 - wy) + bottom * wy);
}

async function applySubtleSmileLift(image: Buffer, smileIntensity: 1 | 2 | 3): Promise<Buffer> {
  if (smileIntensity <= 1) return image;

  const { data, info } = await sharp(image, { failOn: 'none' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const output = Buffer.from(data);
  const lift = height * (smileIntensity === 3 ? 0.014 : 0.008);
  const radiusX = width * 0.09;
  const radiusY = height * 0.07;
  const corners = [
    { x: width * 0.39, y: height * 0.65 },
    { x: width * 0.61, y: height * 0.65 },
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let influence = 0;
      for (const corner of corners) {
        const dx = (x - corner.x) / radiusX;
        const dy = (y - corner.y) / radiusY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 1) {
          influence = Math.max(influence, Math.pow(1 - distance, 2));
        }
      }

      if (influence <= 0) continue;

      const sampleY = Math.min(height - 1, y + lift * influence);
      const offset = (y * width + x) * channels;
      for (let channel = 0; channel < channels; channel++) {
        output[offset + channel] = sampleBilinear(data, width, height, channels, x, sampleY, channel);
      }
    }
  }

  return sharp(output, { raw: { width, height, channels } })
    .jpeg({ quality: RETOUCH_OUTPUT_QUALITY, mozjpeg: true })
    .toBuffer();
}

async function postProcessRetouchOutput(
  output: Buffer,
  original: Buffer | null,
  smileIntensity: 1 | 2 | 3
): Promise<Buffer> {
  let processed = await sharp(output, { failOn: 'none' })
    .rotate()
    .toColorspace('srgb')
    .jpeg({ quality: RETOUCH_OUTPUT_QUALITY, mozjpeg: true })
    .toBuffer();
  const metadata = await sharp(processed, { failOn: 'none' }).metadata();

  if (original && metadata.width && metadata.height) {
    // Blend a little of the source portrait back in to suppress reconstruction artifacts.
    const originalLayer = await sharp(original, { failOn: 'none' })
      .rotate()
      .resize({
        width: metadata.width,
        height: metadata.height,
        fit: 'cover',
      })
      .toColorspace('srgb')
      .modulate({ brightness: 1.03, saturation: 0.98 })
      .ensureAlpha(ORIGINAL_BLEND_OPACITY)
      .png()
      .toBuffer();

    processed = await sharp(processed, { failOn: 'none' })
      .composite([{ input: originalLayer, blend: 'over' }])
      .modulate({ brightness: 1.03, saturation: 0.98 })
      .jpeg({ quality: RETOUCH_OUTPUT_QUALITY, mozjpeg: true })
      .toBuffer();
  }

  const withSmile = await applySubtleSmileLift(processed, smileIntensity);
  return reduceBackgroundStrayHairs(withSmile);
}

async function makeCloudinarySafeImage(
  url: string,
  originalUrl: string,
  smileIntensity: 1 | 2 | 3
): Promise<Buffer> {
  const output = await downloadImage(url);
  const original = await downloadOptionalImage(originalUrl);
  const processed = await postProcessRetouchOutput(output, original, smileIntensity);

  if (processed.byteLength <= TARGET_UPLOAD_BYTES) {
    return processed;
  }

  let fallback: Buffer | null = null;
  for (const maxDimension of MAX_IMAGE_DIMENSIONS) {
    for (const quality of JPEG_QUALITIES) {
      const compressed = await sharp(processed, { failOn: 'none' })
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
    const smileIntensity = normalizeSmileIntensity(searchParams.get('smileIntensity'));

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

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) {
        return NextResponse.json({ success: false, error: 'Cloudinary 설정이 누락되었습니다.' }, { status: 500 });
      }

      const originalUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
      const uploadImage = await makeCloudinarySafeImage(outputUrl as string, originalUrl, smileIntensity);
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
