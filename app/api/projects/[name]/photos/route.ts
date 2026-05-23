import { NextRequest, NextResponse } from 'next/server';
import cloudinary, { getOriginalsFolder, getEnhancedFolder } from '@/lib/cloudinary';
import type { Photo } from '@/types';

export const runtime = 'nodejs';

function getPairingFilename(publicId: string): string {
  const filename = publicId.split('/').pop() ?? publicId;
  return filename
    .replace(/^natural-profile-retouch-/, '')
    .replace(/^retouched-profile-/, '');
}

// GET /api/projects/[name]/photos — 원본 + 보정 사진 목록
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  try {
    const [originalsRes, enhancedRes] = await Promise.all([
      cloudinary.api.resources({
        type: 'upload',
        prefix: `${getOriginalsFolder(decodedName)}/`,
        max_results: 500,
        resource_type: 'image',
      }),
      cloudinary.api.resources({
        type: 'upload',
        prefix: `${getEnhancedFolder(decodedName)}/`,
        max_results: 500,
        resource_type: 'image',
      }).catch(() => ({ resources: [] })), // enhanced 없으면 빈 배열
    ]);

    // enhanced 사진을 Map으로 색인 (파일명 기준으로 원본과 매칭)
    const enhancedMap = new Map<string, { url: string; publicId: string; createdAt?: string; isNaturalProfileRetouch: boolean }>();
    for (const r of enhancedRes.resources) {
      // public_id: "profileai/교육명/enhanced/(natural-profile-retouch-)파일명"
      const filename = getPairingFilename(r.public_id);
      const existing = enhancedMap.get(filename);
      const isNaturalProfileRetouch = r.public_id.split('/').pop()?.startsWith('natural-profile-retouch-') ?? false;
      const shouldReplace = !existing
        || (isNaturalProfileRetouch && !existing.isNaturalProfileRetouch)
        || new Date(r.created_at ?? 0).getTime() > new Date(existing.createdAt ?? 0).getTime();
      if (shouldReplace) {
        enhancedMap.set(filename, {
          url: `${r.secure_url}?t=${new Date(r.created_at || 0).getTime()}`,
          publicId: r.public_id,
          createdAt: r.created_at,
          isNaturalProfileRetouch,
        });
      }
    }

    const photos: Photo[] = originalsRes.resources.map((r: {
      public_id: string;
      secure_url: string;
      width: number;
      height: number;
      bytes: number;
      format: string;
      created_at: string;
    }) => {
      const filename = r.public_id.split('/').pop() ?? r.public_id;
      const enhanced = enhancedMap.get(filename);
      return {
        publicId: r.public_id,
        url: r.secure_url,
        filename,
        width: r.width,
        height: r.height,
        bytes: r.bytes,
        format: r.format,
        type: 'original' as const,
        createdAt: r.created_at,
        enhancedUrl: enhanced?.url,
        enhancedPublicId: enhanced?.publicId,
      };
    });

    // 최신 업로드 순으로 정렬
    photos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, data: photos });
  } catch (error) {
    console.error('[GET /api/projects/[name]/photos]', error);
    return NextResponse.json({ success: false, error: '사진 목록 조회 실패', data: [] }, { status: 500 });
  }
}
