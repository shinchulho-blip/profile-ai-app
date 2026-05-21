// ── 상상우리 내부용 데이터 정의

import type { PhotoTypeId, StyleId } from '@/types';

export interface PhotoTypeOption {
  id: PhotoTypeId;
  label: string;
  description: string;
  recommendedRatio: string;
}

export interface StyleOption {
  id: StyleId;
  label: string;
  description: string;
}

export const PHOTO_TYPES: PhotoTypeOption[] = [
  {
    id: 'closeup',
    label: '얼굴 위주 (명함사진)',
    description: '얼굴이 중심, 1:1 또는 3:4 비율',
    recommendedRatio: '1:1 또는 3:4',
  },
  {
    id: 'upper-body',
    label: '상반신',
    description: '상반신 기준, 3:4 비율',
    recommendedRatio: '3:4',
  },
  {
    id: 'full-body',
    label: '전신',
    description: '전신 기준, 2:3 또는 9:16 비율',
    recommendedRatio: '2:3',
  },
  {
    id: 'free-form',
    label: '자유형',
    description: '원본 비율 유지',
    recommendedRatio: '원본',
  },
];

export const STYLES: StyleOption[] = [
  { id: 'professional', label: '전문적으로', description: '선명하고 깔끔한 보정' },
  { id: 'natural', label: '자연스럽게', description: '피부톤 자연 보정' },
  { id: 'bright', label: '밝고 화사하게', description: '밝기·채도 향상' },
  { id: 'studio', label: '스튜디오 느낌', description: '대비·선명도 강화' },
  { id: 'luxury', label: '고급스럽게', description: '생동감·선명도 향상' },
];
