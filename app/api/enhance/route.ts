import { NextRequest, NextResponse } from 'next/server';
import cloudinary, { getEnhancedFolder } from '@/lib/cloudinary';

export const runtime = 'nodejs';

// 스타일별 Cloudinary 유효 변환 (e_ 접두사 없이 SDK 형식으로 작성)
const STYLE_TRANSFORMATIONS: Record<string, object[]> = {
  natural: [
    { effect: 'improve:50' },
    { effect: 'auto_color' },
  ],
  professional: [
    { effect: 'improve:60' },
    { effect: 'sharpen:50' },
  ],
  bright: [
    { effect: 'improve:70' },
    { effect: 'brightness:15' },
    { effect: 'saturation:20' },
  ],
  studio: [
    { effect: 'improve:80' },
    { effect: 'sharpen:80' },
    { effect: 'contrast:15' },
  ],
  luxury: [
    { effect: 'improve:60' },
    { effect: 'vibrance:30' },
    { effect: 'sharpen:50' },
  ],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { publicId, projectName, style = 'professional', filename } = body;

    if (!publicId || !projectName) {
      return NextResponse.json(
        { success: false, error: 'publicId와 projectName이 필요합니다.' },
        { status: 400 }
      );
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      return NextResponse.json(
        { success: false, error: 'Cloudinary 설정이 누락되었습니다.' },
        { status: 500 }
      );
    }

    const transformations = STYLE_TRANSFORMATIONS[style] ?? STYLE_TRANSFORMATIONS.professional;
    const enhancedFolder = getEnhancedFolder(projectName);
    const baseName = (filename ?? publicId.split('/').pop() ?? 'photo').replace(/\.[^.]+$/, '');

    // 원본 이미지의 plain URL (변환 없음)
    const originalUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;

    // 원본을 가져와서 변환 적용 후 enhanced 폴더에 저장
    const result = await cloudinary.uploader.upload(originalUrl, {
      folder: enhancedFolder,
      public_id: baseName,
      overwrite: true,
      resource_type: 'image',
      transformation: transformations,
    });

    return NextResponse.json({
      success: true,
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[POST /api/enhance] error:', message);
    return NextResponse.json(
      { success: false, error: `보정 처리 실패: ${message}` },
      { status: 500 }
    );
  }
}
