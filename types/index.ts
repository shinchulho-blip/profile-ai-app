// ── 타입 정의 (상상우리 내부용 리빌드)

export interface Project {
  name: string;          // 교육명 (폴더명)
  originalCount: number; // 원본 사진 수
  enhancedCount: number; // 보정 완료 사진 수
  createdAt?: string;
}

export interface Photo {
  publicId: string;      // Cloudinary public_id
  url: string;           // 원본 URL (변환 없음)
  filename: string;      // 파일명
  width: number;
  height: number;
  bytes: number;
  format: string;
  type: 'original' | 'enhanced';
  createdAt: string;
  // 같은 이름의 enhanced 사진이 있으면 페어링
  enhancedUrl?: string;
  enhancedPublicId?: string;
}

export type PhotoTypeId = 'closeup' | 'upper-body' | 'full-body' | 'free-form';
export type StyleId = 'natural' | 'professional' | 'bright' | 'studio' | 'luxury';

export interface EnhanceSettings {
  photoType: PhotoTypeId;
  style: StyleId;
}

export interface UploadResult {
  publicId: string;
  url: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  filename: string;
}

// API 응답
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
