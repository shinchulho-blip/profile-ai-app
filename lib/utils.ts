import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${bytes}B`;
}

export function validateImageFile(file: File): string | null {
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB (원본 사이즈 유지)
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  if (!ALLOWED.includes(file.type)) return '지원하지 않는 파일 형식입니다. (JPG, PNG, WEBP, HEIC)';
  if (file.size > MAX_SIZE) return `파일 크기가 너무 큽니다. (최대 50MB, 현재 ${formatBytes(file.size)})`;
  return null;
}
