// ── Cloudinary SDK 설정 (서버사이드 전용)
// 클라이언트에서 직접 임포트하면 API Secret이 노출되므로 절대 금지
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

// ── 폴더 규칙 (온더코트 스코어보드와 완전 분리)
// 스코어보드: onthecourt/...
// 프로필 도구: profileai/[교육명]/originals/  &  profileai/[교육명]/enhanced/

export const FOLDER_ROOT = 'profileai';

export function getOriginalsFolder(projectName: string) {
  return `${FOLDER_ROOT}/${projectName}/originals`;
}

export function getEnhancedFolder(projectName: string) {
  return `${FOLDER_ROOT}/${projectName}/enhanced`;
}
