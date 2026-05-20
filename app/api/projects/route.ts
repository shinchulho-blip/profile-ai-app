import { NextResponse } from 'next/server';
import cloudinary, { FOLDER_ROOT } from '@/lib/cloudinary';

export const runtime = 'nodejs';

// GET /api/projects — Cloudinary profileai/ 하위 폴더 목록 조회
export async function GET() {
  try {
    // profileai/ 폴더 내 서브폴더 (= 교육 프로젝트) 목록
    const result = await cloudinary.api.sub_folders(FOLDER_ROOT);

    const projects = await Promise.all(
      result.folders.map(async (folder: { name: string; path: string }) => {
        try {
          // 각 프로젝트의 originals / enhanced 사진 수 조회
          const [originals, enhanced] = await Promise.all([
            cloudinary.api.resources({
              type: 'upload',
              prefix: `${folder.path}/originals/`,
              max_results: 1,
            }),
            cloudinary.api.resources({
              type: 'upload',
              prefix: `${folder.path}/enhanced/`,
              max_results: 1,
            }),
          ]);

          return {
            name: folder.name,
            originalCount: originals.total_count ?? 0,
            enhancedCount: enhanced.total_count ?? 0,
          };
        } catch {
          return { name: folder.name, originalCount: 0, enhancedCount: 0 };
        }
      })
    );

    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    // profileai 루트 폴더가 아직 없으면 빈 배열 반환
    console.error('[GET /api/projects]', error);
    return NextResponse.json({ success: true, data: [] });
  }
}
