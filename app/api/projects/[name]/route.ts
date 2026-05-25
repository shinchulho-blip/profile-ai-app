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

// PATCH /api/projects/[name] — 프로젝트명 수정 (모든 원본 및 보정 이미지의 public_id 경로 변경)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!name) return NextResponse.json({ success: false, error: '프로젝트명이 필요합니다.' }, { status: 400 });

  const decodedOldName = decodeURIComponent(name);

  try {
    const { newName } = await req.json();
    if (!newName || !newName.trim()) {
      return NextResponse.json({ success: false, error: '새 프로젝트명이 필요합니다.' }, { status: 400 });
    }
    const decodedNewName = newName.trim();

    if (decodedOldName === decodedNewName) {
      return NextResponse.json({ success: true, message: '이름이 동일합니다.', data: { newName: decodedNewName } });
    }

    // 1. 기존 프로젝트 하위의 원본 및 보정본 이미지 목록 가져오기
    const [originalsRes, enhancedRes] = await Promise.all([
      cloudinary.api.resources({
        type: 'upload',
        prefix: `${getOriginalsFolder(decodedOldName)}/`,
        max_results: 500,
        resource_type: 'image',
      }),
      cloudinary.api.resources({
        type: 'upload',
        prefix: `${getEnhancedFolder(decodedOldName)}/`,
        max_results: 500,
        resource_type: 'image',
      }).catch(() => ({ resources: [] })), // enhanced 없으면 빈 배열
    ]);

    const oldOriginalsPrefix = `${getOriginalsFolder(decodedOldName)}/`;
    const newOriginalsPrefix = `${getOriginalsFolder(decodedNewName)}/`;
    const oldEnhancedPrefix = `${getEnhancedFolder(decodedOldName)}/`;
    const newEnhancedPrefix = `${getEnhancedFolder(decodedNewName)}/`;

    const renamePromises: Promise<any>[] = [];

    // 원본 리소스 public_id 변경
    for (const r of originalsRes.resources) {
      const oldPublicId = r.public_id;
      const filename = oldPublicId.slice(oldOriginalsPrefix.length);
      const newPublicId = `${newOriginalsPrefix}${filename}`;
      renamePromises.push(
        cloudinary.uploader.rename(oldPublicId, newPublicId, { invalidate: true })
      );
    }

    // 보정본 리소스 public_id 변경
    for (const r of enhancedRes.resources) {
      const oldPublicId = r.public_id;
      const filename = oldPublicId.slice(oldEnhancedPrefix.length);
      const newPublicId = `${newEnhancedPrefix}${filename}`;
      renamePromises.push(
        cloudinary.uploader.rename(oldPublicId, newPublicId, { invalidate: true })
      );
    }

    // 리네임 작업 일괄 실행
    await Promise.all(renamePromises);

    // 2. 기존 빈 폴더 정리
    try {
      await cloudinary.api.delete_folder(`${getOriginalsFolder(decodedOldName)}`);
      await cloudinary.api.delete_folder(`${getEnhancedFolder(decodedOldName)}`);
      await cloudinary.api.delete_folder(`profileai/${decodedOldName}`);
    } catch { /* 폴더 삭제 실패는 무시 */ }

    return NextResponse.json({
      success: true,
      message: '프로젝트명이 변경되었습니다.',
      data: { newName: decodedNewName }
    });
  } catch (error) {
    console.error('[PATCH /api/projects/[name]]', error);
    return NextResponse.json({ success: false, error: '프로젝트명 변경 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

