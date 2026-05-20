import { NextRequest, NextResponse } from 'next/server';
import cloudinary, { getOriginalsFolder, getEnhancedFolder } from '@/lib/cloudinary';

export const runtime = 'nodejs';

// DELETE /api/projects/[name] — 프로젝트 전체 삭제 (originals + enhanced)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!name) return NextResponse.json({ success: false, error: '프로젝트명이 필요합니다.' }, { status: 400 });

  const decodedName = decodeURIComponent(name);

  try {
    // originals 폴더 전체 삭제
    await cloudinary.api.delete_resources_by_prefix(
      `${getOriginalsFolder(decodedName)}/`
    );
    // enhanced 폴더 전체 삭제
    await cloudinary.api.delete_resources_by_prefix(
      `${getEnhancedFolder(decodedName)}/`
    );
    // 빈 폴더 정리
    try {
      await cloudinary.api.delete_folder(`${getOriginalsFolder(decodedName)}`);
      await cloudinary.api.delete_folder(`${getEnhancedFolder(decodedName)}`);
      await cloudinary.api.delete_folder(`profileai/${decodedName}`);
    } catch { /* 폴더 삭제 실패는 무시 */ }

    return NextResponse.json({ success: true, message: `${decodedName} 프로젝트가 삭제되었습니다.` });
  } catch (error) {
    console.error('[DELETE /api/projects/[name]]', error);
    return NextResponse.json({ success: false, error: '삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
