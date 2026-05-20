import { NextRequest, NextResponse } from 'next/server';
import cloudinary, { getOriginalsFolder, getEnhancedFolder } from '@/lib/cloudinary';
import archiver from 'archiver';
import { Readable } from 'stream';

export const runtime = 'nodejs';
export const maxDuration = 60;

// GET /api/projects/[name]/download?type=all|originals|enhanced
// 프로젝트 사진 전체를 ZIP으로 다운로드
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const type = req.nextUrl.searchParams.get('type') ?? 'all'; // all | originals | enhanced

  try {
    const prefixes: string[] = [];
    if (type === 'all' || type === 'originals') {
      prefixes.push(`${getOriginalsFolder(decodedName)}/`);
    }
    if (type === 'all' || type === 'enhanced') {
      prefixes.push(`${getEnhancedFolder(decodedName)}/`);
    }

    // 대상 사진 목록 수집
    const allResources: { url: string; filename: string; folder: string }[] = [];
    for (const prefix of prefixes) {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix,
        max_results: 500,
        resource_type: 'image',
      }).catch(() => ({ resources: [] }));

      const folderLabel = prefix.includes('/enhanced/') ? 'enhanced' : 'originals';
      for (const r of result.resources) {
        const filename = r.public_id.split('/').pop() ?? r.public_id;
        allResources.push({
          url: r.secure_url,
          filename: `${folderLabel}/${filename}.${r.format}`,
          folder: folderLabel,
        });
      }
    }

    if (allResources.length === 0) {
      return NextResponse.json({ success: false, error: '다운로드할 사진이 없습니다.' }, { status: 404 });
    }

    // archiver로 ZIP 스트림 생성
    const archive = archiver('zip', { zlib: { level: 6 } });

    // Node.js Readable → Web ReadableStream 변환
    const nodeReadable = new Readable({ read() {} });
    archive.pipe(nodeReadable as unknown as NodeJS.WritableStream);

    // 각 이미지를 fetch해서 ZIP에 추가
    for (const resource of allResources) {
      const imgRes = await fetch(resource.url);
      if (!imgRes.ok) continue;
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      archive.append(buffer, { name: resource.filename });
    }

    archive.finalize();

    // Web ReadableStream으로 변환
    const webStream = new ReadableStream({
      start(controller) {
        nodeReadable.on('data', (chunk) => controller.enqueue(chunk));
        nodeReadable.on('end', () => controller.close());
        nodeReadable.on('error', (err) => controller.error(err));
      },
    });

    const safeProjectName = decodedName.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    return new Response(webStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeProjectName}_${type}.zip"`,
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('[GET /api/projects/[name]/download]', error);
    return NextResponse.json({ success: false, error: 'ZIP 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
