import { NextRequest, NextResponse } from 'next/server';
import cloudinary, { getEnhancedFolder } from '@/lib/cloudinary';

export const runtime = 'nodejs';

// POST /api/enhance — Cloudinary 자동 보정 후 enhanced 폴더에 저장
// 실제 AI 대신 Cloudinary 내장 보정 필터 사용 (e_improve, e_brightface)
// 향후 Replicate/Photoroom 등 실제 AI로 교체 가능

const STYLE_TRANSFORMATIONS: Record<string, object[]> = {
  natural: [
    { effect: 'improve:outdoor:30' },
    { effect: 'brightface' },
  ],
  professional: [
    { effect: 'improve:indoor:50' },
    { effect: 'brightface' },
    { effect: 'sharpen:60' },
  ],
  bright: [
    { effect: 'improve:50' },
    { effect: 'brightface' },
    { effect: 'saturation:20' },
    { effect: 'brightness:15' },
  ],
  studio: [
    { effect: 'improve:indoor:60' },
    { effect: 'brightface' },
    { effect: 'sharpen:80' },
    { effect: 'contrast:10' },
  ],
  luxury: [
    { effect: 'improve:50' },
    { effect: 'brightface' },
    { effect: 'vibrance:30' },
    { effect: 'sharpen:50' },
  ],
};

export async function POST(req: NextRequest) {
  try {
    const { publicId, projectName, style = 'professional', filename } = await req.json();

    if (!publicId || !projectName) {
      return NextResponse.json({ success: false, error: 'publicId와 projectName이 필요합니다.' }, { status: 400 });
    }

    const transformations = STYLE_TRANSFORMATIONS[style] ?? STYLE_TRANSFORMATIONS.professional;
    const enhancedFolder = getEnhancedFolder(projectName);

    // 원본 Cloudinary URL에 변환 적용 후 enhanced 폴더에 새 파일로 업로드
    const originalUrl = cloudinary.url(publicId, {
      secure: true,
      transformation: transformations,
      fetch_format: 'auto',
    });

    // 변환된 이미지를 enhanced 폴더에 저장
    const baseName = filename?.replace(/\.[^.]+$/, '') ?? publicId.split('/').pop();
    const result = await cloudinary.uploader.upload(originalUrl, {
      folder: enhancedFolder,
      public_id: baseName,
      overwrite: true,
      resource_type: 'image',
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
  } catch (error) {
    console.error('[POST /api/enhance]', error);
    return NextResponse.json({ success: false, error: '보정 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
