import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PhotoTypeId, StyleId, UseCaseId } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Determines recommended output ratios based on photo type and use case.
 * This logic can be extended when integrating with Cloudinary's transformation API.
 *
 * @param photoType - Selected photo type (closeup, upper-body, full-body, free-form)
 * @param useCase - Selected use case (명함, LinkedIn, etc.)
 * @returns Array of recommended aspect ratios
 */
export function getRecommendedRatios(
  photoType: PhotoTypeId | null,
  useCase: UseCaseId | null
): string[] {
  if (!photoType) return [];

  const ratioMap: Record<PhotoTypeId, Record<string, string[]>> = {
    closeup: {
      명함: ["1:1", "3:4"],
      이력서: ["3:4", "1:1"],
      LinkedIn: ["1:1", "3:4"],
      카카오톡: ["1:1"],
      인스타그램: ["1:1"],
      "강사 프로필": ["3:4", "1:1"],
      "회사 홈페이지": ["1:1", "3:4"],
      포트폴리오: ["3:4", "1:1"],
      default: ["1:1", "3:4"],
    },
    "upper-body": {
      명함: ["4:5", "3:4"],
      이력서: ["3:4", "4:5"],
      LinkedIn: ["4:5", "3:4"],
      카카오톡: ["1:1", "4:5"],
      인스타그램: ["4:5", "1:1"],
      "강사 프로필": ["4:5", "3:4"],
      "회사 홈페이지": ["3:4", "4:5"],
      포트폴리오: ["4:5", "3:4"],
      default: ["4:5", "3:4"],
    },
    "full-body": {
      명함: ["2:3", "9:16"],
      이력서: ["2:3"],
      LinkedIn: ["2:3", "9:16"],
      카카오톡: ["9:16", "2:3"],
      인스타그램: ["9:16", "2:3"],
      "강사 프로필": ["2:3"],
      "회사 홈페이지": ["2:3"],
      포트폴리오: ["2:3", "9:16"],
      default: ["2:3", "9:16"],
    },
    "free-form": {
      명함: ["1:1", "4:5"],
      이력서: ["1:1", "4:5"],
      LinkedIn: ["1:1"],
      카카오톡: ["1:1", "4:5"],
      인스타그램: ["1:1", "4:5"],
      "강사 프로필": ["4:5", "1:1"],
      "회사 홈페이지": ["1:1", "4:5"],
      포트폴리오: ["4:5", "1:1"],
      default: ["1:1", "4:5"],
    },
  };

  const map = ratioMap[photoType];
  if (!map) return [];

  if (useCase && map[useCase]) {
    return map[useCase];
  }
  return map.default || [];
}

/**
 * Returns a human-readable label for the style ID.
 * This mapping is used when displaying result summaries.
 */
export function getStyleLabel(styleId: StyleId | null): string {
  const labels: Record<StyleId, string> = {
    natural: "자연스럽게",
    professional: "전문적으로",
    bright: "밝고 화사하게",
    studio: "스튜디오 느낌",
    luxury: "고급스럽게",
  };
  return styleId ? labels[styleId] : "—";
}

/**
 * Returns a human-readable label for the photo type ID.
 */
export function getPhotoTypeLabel(photoTypeId: PhotoTypeId | null): string {
  const labels: Record<PhotoTypeId, string> = {
    closeup: "얼굴 위주 명함사진",
    "upper-body": "상반신 사진",
    "full-body": "전신 사진",
    "free-form": "자유형 사진",
  };
  return photoTypeId ? labels[photoTypeId] : "—";
}

/**
 * Simulates processing delay (mock).
 * Replace with actual API call when integrating with Replicate / Photoroom.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validates the uploaded file type and size.
 * @param file - File to validate
 * @returns Validation result
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
  const maxSize = 20 * 1024 * 1024; // 20MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "JPG, PNG, WebP, HEIC 형식만 업로드할 수 있습니다.",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "파일 크기는 20MB 이하여야 합니다.",
    };
  }

  return { valid: true };
}

/**
 * Converts file to base64 data URL for preview.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
