import { NextResponse } from 'next/server';
import cloudinary, { FOLDER_ROOT } from '@/lib/cloudinary';

export const runtime = 'nodejs';

// GET /api/projects — Cloudinary profileai/ 하위 모든 리소스를 조회하여 사진이 업로드된 실시간 프로젝트 목록 구성
export async function GET() {
  try {
    // 1. profileai/ 하위의 모든 이미지 리소스 조회 (단일 API 호출)
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: `${FOLDER_ROOT}/`,
      max_results: 500,
      resource_type: 'image',
    }).catch(() => ({ resources: [] }));

    const projectMap = new Map<string, { name: string; originalCount: number; enhancedCount: number }>();

    // 2. 리소스의 public_id에서 프로젝트명 추출하여 카운트 집계
    for (const r of result.resources) {
      const publicId = r.public_id;
      const parts = publicId.split('/');
      
      // 형식: profileai/[projectName]/[originals|enhanced]/[filename]
      if (parts.length >= 3 && parts[0] === FOLDER_ROOT) {
        const projectName = parts[1];
        const category = parts[2]; // originals or enhanced

        if (!projectMap.has(projectName)) {
          projectMap.set(projectName, {
            name: projectName,
            originalCount: 0,
            enhancedCount: 0,
          });
        }

        const project = projectMap.get(projectName)!;
        if (category === 'originals') {
          project.originalCount++;
        } else if (category === 'enhanced') {
          project.enhancedCount++;
        }
      }
    }

    // 3. 사진이 1장이라도 업로드되어 활성화된 프로젝트만 메인 페이지에 노출
    // (삭제 완료 후 잔재로 남은 빈 폴더 및 빈 프로젝트 이름 변경 시 생기는 0장 프로젝트 필터링)
    const projects = Array.from(projectMap.values()).filter(p => p.originalCount > 0);

    // 프로젝트명 가나다순으로 정렬
    projects.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error('[GET /api/projects]', error);
    return NextResponse.json({ success: true, data: [] });
  }
}



