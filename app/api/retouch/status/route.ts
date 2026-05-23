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
const ENHANCED_FACE_OPACITY = 0.62;
const BACKGROUND_CLEANUP_OPACITY = 0.55;
const EXPRESSION_LINE_SOFTEN_OPACITY = 0.52;
const DEFAULT_SMILE_INTENSITY = 3;

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
};

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

function getPortraitLayout(width: number, height: number): PortraitLayout {
  const aspect = height / width;

  if (aspect >= 1.15) {
    return {
      face: { cx: 0.5, cy: 0.32, rx: 0.17, ry: 0.18 },
      mouth: { y: 0.43, leftX: 0.43, rightX: 0.57, radiusX: 0.08, radiusY: 0.055 },
      wrinkleSpots: [
        { cx: 0.43, cy: 0.43, rx: 0.055, ry: 0.11 },
        { cx: 0.57, cy: 0.43, rx: 0.055, ry: 0.11 },
        { cx: 0.43, cy: 0.51, rx: 0.06, ry: 0.055 },
        { cx: 0.57, cy: 0.51, rx: 0.06, ry: 0.055 },
      ],
      lines: {
        leftNasolabial: [0.46, 0.36, 0.42, 0.40, 0.42, 0.46, 0.45, 0.50],
        rightNasolabial: [0.54, 0.36, 0.58, 0.40, 0.58, 0.46, 0.55, 0.50],
        leftMouth: [0.44, 0.46, 0.40, 0.49, 0.42, 0.54, 0.46, 0.56],
        rightMouth: [0.56, 0.46, 0.60, 0.49, 0.58, 0.54, 0.54, 0.56],
      },
    };
  }

  return {
    face: { cx: 0.5, cy: 0.45, rx: 0.21, ry: 0.25 },
    mouth: { y: 0.66, leftX: 0.38, rightX: 0.62, radiusX: 0.12, radiusY: 0.09 },
    wrinkleSpots: [
      { cx: 0.42, cy: 0.62, rx: 0.075, ry: 0.14 },
      { cx: 0.58, cy: 0.62, rx: 0.075, ry: 0.14 },
      { cx: 0.42, cy: 0.74, rx: 0.08, ry: 0.07 },
      { cx: 0.58, cy: 0.74, rx: 0.08, ry: 0.07 },
    ],
    lines: {
      leftNasolabial: [0.43, 0.55, 0.40, 0.60, 0.39, 0.66, 0.43, 0.71],
      rightNasolabial: [0.57, 0.55, 0.60, 0.60, 0.61, 0.66, 0.57, 0.71],
      leftMouth: [0.43, 0.68, 0.40, 0.72, 0.42, 0.77, 0.46, 0.80],
      rightMouth: [0.57, 0.68, 0.60, 0.72, 0.58, 0.77, 0.54, 0.80],
    },
  };
}

function buildFaceBlendMask(width: number, height: number): Buffer {
  const { face } = getPortraitLayout(width, height);

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="${width * face.cx}" cy="${height * face.cy}" rx="${width * face.rx}" ry="${height * face.ry}" fill="white"/>
    </svg>
  `);
}

function buildBackgroundCleanupMask(width: number, height: number): Buffer {
  const { face } = getPortraitLayout(width, height);

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <mask id="cleanup-mask">
          <rect width="100%" height="100%" fill="white"/>
          <ellipse cx="${width * face.cx}" cy="${height * face.cy}" rx="${width * (face.rx + 0.08)}" ry="${height * (face.ry + 0.13)}" fill="black"/>
          <rect x="${width * 0.22}" y="${height * 0.74}" width="${width * 0.56}" height="${height * 0.26}" fill="black"/>
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

  // Lighten only dark flyaway pixels in the outer background to avoid two-tone halos.
  const cleanedBackground = await sharp(image, { failOn: 'none' })
    .median(5)
    .blur(1.4)
    .ensureAlpha(BACKGROUND_CLEANUP_OPACITY)
    .png()
    .toBuffer();
  const maskedCleanup = await sharp(cleanedBackground, { failOn: 'none' })
    .composite([{ input: buildBackgroundCleanupMask(width, height), blend: 'dest-in' }])
    .png()
    .toBuffer();

  return sharp(image, { failOn: 'none' })
    .composite([{ input: maskedCleanup, blend: 'lighten' }])
    .jpeg({ quality: RETOUCH_OUTPUT_QUALITY, mozjpeg: true })
    .toBuffer();
}

function normalizeSmileIntensity(value: string | null): 1 | 2 | 3 {
  const parsed = Number(value);
  if (parsed === 1 || parsed === 2 || parsed === 3) return parsed;
  return DEFAULT_SMILE_INTENSITY;
}

function buildExpressionLineMask(width: number, height: number): Buffer {
  const strokeWidth = Math.max(26, width * 0.055);
  const { lines, wrinkleSpots } = getPortraitLayout(width, height);
  const path = ([x1, y1, x2, y2, x3, y3, x4, y4]: PortraitLayout['lines']['leftNasolabial']) =>
    `M ${width * x1} ${height * y1} C ${width * x2} ${height * y2}, ${width * x3} ${height * y3}, ${width * x4} ${height * y4}`;
  const ellipses = wrinkleSpots
    .map(({ cx, cy, rx, ry }) =>
      `<ellipse cx="${width * cx}" cy="${height * cy}" rx="${width * rx}" ry="${height * ry}" fill="white" opacity="0.58"/>`
    )
    .join('');

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${ellipses}
      <g fill="none" stroke="white" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
        <path d="${path(lines.leftNasolabial)}" />
        <path d="${path(lines.rightNasolabial)}" />
        <path d="${path(lines.leftMouth)}" />
        <path d="${path(lines.rightMouth)}" />
      </g>
    </svg>
  `);
}

async function softenNoseAndMouthLines(image: Buffer): Promise<Buffer> {
  const metadata = await sharp(image, { failOn: 'none' }).metadata();
  const { width, height } = metadata;

  if (!width || !height) {
    return image;
  }

  const softenedLines = await sharp(image, { failOn: 'none' })
    .median(5)
    .blur(1.1)
    .modulate({ brightness: 1.08, saturation: 0.98 })
    .ensureAlpha(EXPRESSION_LINE_SOFTEN_OPACITY)
    .png()
    .toBuffer();
  const maskedLines = await sharp(softenedLines, { failOn: 'none' })
    .composite([{ input: buildExpressionLineMask(width, height), blend: 'dest-in' }])
    .png()
    .toBuffer();

  return sharp(image, { failOn: 'none' })
    .composite([{ input: maskedLines, blend: 'lighten' }])
    .jpeg({ quality: RETOUCH_OUTPUT_QUALITY, mozjpeg: true })
    .toBuffer();
}

async function postProcessRetouchOutput(
  output: Buffer,
  original: Buffer | null,
  smileIntensity: 1 | 2 | 3
): Promise<Buffer> {
  let processed: Buffer;
  if (original) {
    const base = await sharp(original, { failOn: 'none' })
      .rotate()
      .toColorspace('srgb')
      .jpeg({ quality: RETOUCH_OUTPUT_QUALITY, mozjpeg: true })
      .toBuffer();
    const metadata = await sharp(base, { failOn: 'none' }).metadata();

    if (!metadata.width || !metadata.height) {
      processed = base;
    } else {
      const enhancedFace = await sharp(output, { failOn: 'none' })
        .rotate()
        .resize({
          width: metadata.width,
          height: metadata.height,
          fit: 'cover',
        })
        .toColorspace('srgb')
        .ensureAlpha(ENHANCED_FACE_OPACITY)
        .png()
        .toBuffer();
      const maskedFace = await sharp(enhancedFace, { failOn: 'none' })
        .composite([{ input: buildFaceBlendMask(metadata.width, metadata.height), blend: 'dest-in' }])
        .png()
        .toBuffer();

      processed = await sharp(base, { failOn: 'none' })
        .composite([{ input: maskedFace, blend: 'over' }])
        .modulate({ saturation: 0.98 })
        .jpeg({ quality: RETOUCH_OUTPUT_QUALITY, mozjpeg: true })
        .toBuffer();
    }
  } else {
    processed = await sharp(output, { failOn: 'none' })
      .rotate()
      .toColorspace('srgb')
      .jpeg({ quality: RETOUCH_OUTPUT_QUALITY, mozjpeg: true })
      .toBuffer();
  }

  // Avoid geometric smile warping; it can distort the jaw on varied portrait crops.
  const withSofterLines = smileIntensity > 1
    ? await softenNoseAndMouthLines(processed)
    : processed;
  return reduceBackgroundStrayHairs(withSofterLines);
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
