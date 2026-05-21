import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export const runtime = 'nodejs';

// DELETE /api/photos — 선택한 사진들만 삭제
export async function DELETE(req: NextRequest) {
  try {
    const { publicIds } = await req.json();

    if (!Array.isArray(publicIds) || publicIds.length === 0) {
      return NextResponse.json({ success: false, error: '삭제할 사진을 선택해주세요.' }, { status: 400 });
    }

    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: 'image',
      type: 'upload',
    });

    return NextResponse.json({
      success: true,
      deleted: Object.keys(result.deleted ?? {}).length,
      message: `${publicIds.length}장이 삭제되었습니다.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[DELETE /api/photos]', message);
    return NextResponse.json({ success: false, error: '삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
