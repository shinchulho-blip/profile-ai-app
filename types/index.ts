// ================================================
// Core Types for Profile AI App
// ================================================

export type PhotoTypeId = 'closeup' | 'upper-body' | 'full-body' | 'free-form';
export type UseCaseId =
  | '명함'
  | '이력서'
  | 'LinkedIn'
  | '카카오톡'
  | '인스타그램'
  | '강사 프로필'
  | '회사 홈페이지'
  | '포트폴리오';
export type StyleId =
  | 'natural'
  | 'professional'
  | 'bright'
  | 'studio'
  | 'luxury';

export interface PhotoType {
  id: PhotoTypeId;
  title: string;
  description: string;
  longDescription: string;
  icon: string;
  useCases: string[];
  ratios: string[];
  processingSteps: string[];
}

export interface Style {
  id: StyleId;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface UseCase {
  id: UseCaseId;
  label: string;
  icon: string;
  color: string;
}

export interface EditorState {
  uploadedImage: string | null;
  selectedPhotoType: PhotoTypeId | null;
  selectedUseCase: UseCaseId | null;
  selectedStyle: StyleId | null;
  isProcessing: boolean;
  resultImage: string | null;
  recommendedRatios: string[];
  error: string | null;
  step: number;
}

// ================================================
// API Types
// ================================================

export interface EnhanceRequest {
  imageUrl: string;
  photoType: PhotoTypeId;
  useCase: UseCaseId;
  style: StyleId;
}

export interface EnhanceResponse {
  success: boolean;
  enhancedImageUrl: string;
  recommendedRatios: string[];
  message: string;
  metadata?: {
    processingTime: number;
    appliedCorrections: string[];
  };
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}
