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

const RETOUCH_OUTPUT_QUALITY = 92;

const RETOUCH_STRENGTHS = {
  natural: {
    smooth: 0.25,
    lighten: 0.45,
  },
  standard: {
    smooth: 0.50,
    lighten: 0.75,
  },
  polished: {
    smooth: 0.85,
    lighten: 0.95,
  },
} as const;

type PortraitLayout = {
  face: { cx: number; cy: number; rx: number; ry: number };
  mouth: { y: number; leftX: number; rightX: number; radiusX: number; radiusY: number };
  wrinkleSpots: Array<{ cx: number; cy: number; rx: number; ry: number }>;
  lines: {
    leftNasolabial: [number, number, number, number, number, number, number, number];
    rightNasolabial: [number, number, number, number, number, number, number, number];
    leftMouth: [number, number, number, number, number, number, number, number];
    rightMouth: [number, number, number, number, number, number, number, number];
  };
  noseBridge: { cx: number; cy: number; rx: number; ry: number };
  noseBase: { cx: number; cy: number; rx: number; ry: number };
};

function getPortraitLayout(width: number, height: number): PortraitLayout {
  const aspect = height / width;

  if (aspect >= 1.15) {
    return {
      face: { cx: 0.5, cy: 0.32, rx: 0.17, ry: 0.18 },
      mouth: { y: 0.43, leftX: 0.43, rightX: 0.57, radiusX: 0.08, radiusY: 0.055 },
      wrinkleSpots: [
        { cx: 0.42, cy: 0.43, rx: 0.075, ry: 0.14 },
        { cx: 0.58, cy: 0.43, rx: 0.075, ry: 0.14 },
        { cx: 0.42, cy: 0.52, rx: 0.085, ry: 0.07 },
        { cx: 0.58, cy: 0.52, rx: 0.085, ry: 0.07 },
      ],
      lines: {
        leftNasolabial: [0.46, 0.36, 0.42, 0.40, 0.42, 0.46, 0.45, 0.50],
        rightNasolabial: [0.54, 0.36, 0.58, 0.40, 0.58, 0.46, 0.55, 0.50],
        leftMouth: [0.44, 0.46, 0.40, 0.49, 0.42, 0.54, 0.46, 0.56],
        rightMouth: [0.56, 0.46, 0.60, 0.49, 0.58, 0.54, 0.54, 0.56],
      },
      noseBridge: { cx: 0.5, cy: 0.33, rx: 0.03, ry: 0.07 },
      noseBase: { cx: 0.5, cy: 0.395, rx: 0.048, ry: 0.035 },
    };
  }

  return {
    face: { cx: 0.5, cy: 0.45, rx: 0.21, ry: 0.25 },
    mouth: { y: 0.66, leftX: 0.38, rightX: 0.62, radiusX: 0.12, radiusY: 0.09 },
    wrinkleSpots: [
      { cx: 0.41, cy: 0.62, rx: 0.095, ry: 0.17 },
      { cx: 0.59, cy: 0.62, rx: 0.095, ry: 0.17 },
      { cx: 0.41, cy: 0.75, rx: 0.10, ry: 0.09 },
      { cx: 0.59, cy: 0.75, rx: 0.10, ry: 0.09 },
    ],
    lines: {
      leftNasolabial: [0.43, 0.55, 0.40, 0.60, 0.39, 0.66, 0.43, 0.71],
      rightNasolabial: [0.57, 0.55, 0.60, 0.60, 0.61, 0.66, 0.57, 0.71],
      leftMouth: [0.43, 0.68, 0.40, 0.72, 0.42, 0.77, 0.46, 0.80],
      rightMouth: [0.57, 0.68, 0.60, 0.72, 0.58, 0.77, 0.54, 0.80],
    },
    noseBridge: { cx: 0.5, cy: 0.48, rx: 0.05, ry: 0.09 },
    noseBase: { cx: 0.5, cy: 0.60, rx: 0.065, ry: 0.05 },
  };
}

function buildExpressionLineMask(width: number, height: number): Buffer {
  const strokeWidth = Math.max(34, width * 0.075);
  const { lines, wrinkleSpots, noseBridge, noseBase } = getPortraitLayout(width, height);
  const path = ([x1, y1, x2, y2, x3, y3, x4, y4]: PortraitLayout['lines']['leftNasolabial']) =>
    `M ${width * x1} ${height * y1} C ${width * x2} ${height * y2}, ${width * x3} ${height * y3}, ${width * x4} ${height * y4}`;
  const ellipses = wrinkleSpots
    .map(({ cx, cy, rx, ry }) =>
      `<ellipse cx="${width * cx}" cy="${height * cy}" rx="${width * rx}" ry="${height * ry}" fill="white" opacity="0.76"/>`
    )
    .join('');

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <mask id="exclude-nose-mask">
          <rect x="0" y="0" width="${width}" height="${height}" fill="white" />
          <!-- Exclude nose bridge -->
          <ellipse cx="${width * noseBridge.cx}" cy="${height * noseBridge.cy}" rx="${width * noseBridge.rx}" ry="${height * noseBridge.ry}" fill="black" />
          <!-- Exclude nose base (nostrils and wings) -->
          <ellipse cx="${width * noseBase.cx}" cy="${height * noseBase.cy}" rx="${width * noseBase.rx}" ry="${height * noseBase.ry}" fill="black" />
        </mask>
      </defs>
      <g mask="url(#exclude-nose-mask)">
        ${ellipses}
        <g fill="none" stroke="white" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="0.96">
          <path d="${path(lines.leftNasolabial)}" />
          <path d="${path(lines.rightNasolabial)}" />
          <path d="${path(lines.leftMouth)}" />
          <path d="${path(lines.rightMouth)}" />
        </g>
      </g>
    </svg>
  `);
}

async function softenNoseAndMouthLines(
  image: Buffer,
  smoothOpacity: number,
  lightenOpacity: number
): Promise<Buffer> {
  const metadata = await sharp(image, { failOn: 'none' }).metadata();
  const { width, height } = metadata;

  if (!width || !height) {
    return image;
  }

  const lineMask = buildExpressionLineMask(width, height);
  
  // Feather the mask using sharp to ensure perfectly soft transitions and completely natural edges
  const blurRadius = Math.max(12, Math.round(width * 0.015));
  const featheredMask = await sharp(lineMask, { failOn: 'none' })
    .blur(blurRadius)
    .png()
    .toBuffer();

  const smoothedLines = await sharp(image, { failOn: 'none' })
    .median(7)
    .blur(1.8)
    .modulate({ brightness: 1.03, saturation: 0.98 })
    .ensureAlpha(smoothOpacity)
    .png()
    .toBuffer();
  const maskedSmoothedLines = await sharp(smoothedLines, { failOn: 'none' })
    .composite([{ input: featheredMask, blend: 'dest-in' }])
    .png()
    .toBuffer();
  const smoothedImage = await sharp(image, { failOn: 'none' })
    .composite([{ input: maskedSmoothedLines, blend: 'over' }])
    .jpeg({ quality: RETOUCH_OUTPUT_QUALITY, mozjpeg: true })
    .toBuffer();
  const lightenedLines = await sharp(smoothedImage, { failOn: 'none' })
    .median(5)
    .blur(1.2)
    .modulate({ brightness: 1.16, saturation: 0.98 })
    .ensureAlpha(lightenOpacity)
    .png()
    .toBuffer();
  const maskedLightenedLines = await sharp(lightenedLines, { failOn: 'none' })
    .composite([{ input: featheredMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  return sharp(smoothedImage, { failOn: 'none' })
    .composite([{ input: maskedLightenedLines, blend: 'lighten' }])
    .jpeg({ quality: RETOUCH_OUTPUT_QUALITY, mozjpeg: true })
    .toBuffer();
}

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

function buildNoseRestoreMask(width: number, height: number): Buffer {
  const { noseBridge, noseBase } = getPortraitLayout(width, height);
  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="${width * noseBridge.cx}" cy="${height * noseBridge.cy}" rx="${width * noseBridge.rx}" ry="${height * noseBridge.ry}" fill="white" />
      <ellipse cx="${width * noseBase.cx}" cy="${height * noseBase.cy}" rx="${width * noseBase.rx}" ry="${height * noseBase.ry}" fill="white" />
    </svg>
  `);
}

async function restoreOriginalNose(
  processedImage: Buffer,
  originalImage: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  const noseMask = buildNoseRestoreMask(width, height);
  const blurRadius = Math.max(12, Math.round(width * 0.015));
  const featheredNoseMask = await sharp(noseMask, { failOn: 'none' })
    .blur(blurRadius)
    .png()
    .toBuffer();

  const originalNose = await sharp(originalImage, { failOn: 'none' })
    .composite([{ input: featheredNoseMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  return sharp(processedImage, { failOn: 'none' })
    .composite([{ input: originalNose, blend: 'over' }])
    .jpeg({ quality: RETOUCH_OUTPUT_QUALITY, mozjpeg: true })
    .toBuffer();
}

async function compressIfNeeded(image: Buffer): Promise<Buffer> {
  if (image.byteLength <= TARGET_UPLOAD_BYTES) {
    return image;
  }

  let fallback: Buffer | null = null;
  for (const maxDimension of MAX_IMAGE_DIMENSIONS) {
    for (const quality of JPEG_QUALITIES) {
      const compressed = await sharp(image, { failOn: 'none' })
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

async function makeCloudinarySafeImage(
  url: string,
  originalUrl: string,
  strength: 'natural' | 'standard' | 'polished'
): Promise<Buffer> {
  const image = await downloadImage(url);
  const originalImage = await downloadImage(originalUrl);

  const normalized = await sharp(image, { failOn: 'none' })
    .rotate()
    .toColorspace('srgb')
    .jpeg({ quality: JPEG_QUALITIES[0], mozjpeg: true })
    .toBuffer();

  const metadata = await sharp(normalized, { failOn: 'none' }).metadata();
  const { width, height } = metadata;

  // Resize the original image to match EXACTLY the AI output's dimensions.
  // This guarantees pixel-perfect mask alignment and vastly optimizes processing speeds.
  const normalizedOriginal = await sharp(originalImage, { failOn: 'none' })
    .rotate()
    .resize({
      width: width ?? undefined,
      height: height ?? undefined,
      fit: 'fill',
    })
    .toColorspace('srgb')
    .jpeg({ quality: JPEG_QUALITIES[0], mozjpeg: true })
    .toBuffer();

  const config = RETOUCH_STRENGTHS[strength] ?? RETOUCH_STRENGTHS.standard;
  const processed = await softenNoseAndMouthLines(normalized, config.smooth, config.lighten);

  if (width && height) {
    const finalProcessed = await restoreOriginalNose(processed, normalizedOriginal, width, height);
    return compressIfNeeded(finalProcessed);
  }

  return compressIfNeeded(processed);
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
      const strength = (searchParams.get('strength') ?? 'standard') as 'natural' | 'standard' | 'polished';
      
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
      // Limit original image to 2048px on the fly using Cloudinary's dynamic CDN transformations.
      // This drops the download size from e.g. 20MB to ~500KB, completely resolving 504 timeouts.
      const originalUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_limit,w_2048,h_2048/a_auto,q_auto:best,f_jpg/${publicId}`;

      const uploadImage = await makeCloudinarySafeImage(outputUrl as string, originalUrl, strength);
      const uploaded = await uploadImageBuffer(uploadImage, {
        folder: enhancedFolder,
        publicId: `natural-profile-retouch-${baseName}`,
      });

      return NextResponse.json({
        success: true,
        status:  'succeeded',
        data: {
          publicId: uploaded.public_id,
          url:      `${uploaded.secure_url}?t=${Date.now()}`,
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
