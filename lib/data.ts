import type { PhotoType, Style, UseCase } from "@/types";

// ================================================
// Photo Types Data
// ================================================

export const photoTypes: PhotoType[] = [
  {
    id: "closeup",
    title: "얼굴 위주 명함사진",
    description: "얼굴과 어깨 중심의 사진입니다.",
    longDescription:
      "얼굴과 어깨가 명확하게 보이는 클로즈업 사진으로, 명함이나 이력서에 적합한 단정한 프로필 사진을 만들어 드립니다.",
    icon: "User",
    useCases: ["명함", "이력서", "LinkedIn", "사원증"],
    ratios: ["1:1", "3:4"],
    processingSteps: [
      "얼굴과 어깨 중심 자동 크롭",
      "1:1 또는 3:4 비율 최적화",
      "깔끔한 배경 정리",
      "피부톤과 밝기 자동 보정",
    ],
  },
  {
    id: "upper-body",
    title: "상반신 사진",
    description: "가슴 또는 허리 위까지 나온 사진입니다.",
    longDescription:
      "가슴이나 허리 위까지 나온 상반신 사진으로, 강사 프로필이나 회사 홈페이지에 최적화된 전문적인 이미지로 보정해 드립니다.",
    icon: "UserSquare",
    useCases: ["강사 프로필", "컨설턴트 소개", "회사 홈페이지", "전문가 소개"],
    ratios: ["4:5", "3:4"],
    processingSteps: [
      "상반신 구도 자동 최적화",
      "4:5 또는 3:4 비율 조정",
      "배경 자연스럽게 블러 처리",
      "얼굴 밝기와 전체 색감 보정",
    ],
  },
  {
    id: "full-body",
    title: "전신 사진",
    description: "머리부터 발끝까지 나온 사진입니다.",
    longDescription:
      "전신이 담긴 사진으로, 모델 포트폴리오나 SNS 콘텐츠에 적합한 세련된 전신 프로필 사진을 만들어 드립니다.",
    icon: "PersonStanding",
    useCases: ["모델 프로필", "포트폴리오", "퍼스널 브랜딩", "SNS 콘텐츠"],
    ratios: ["2:3", "9:16"],
    processingSteps: [
      "전신 구도 자동 보정",
      "2:3 또는 9:16 비율 최적화",
      "전체 조명과 색감 균형 조정",
      "배경 정리 및 색상 보정",
    ],
  },
  {
    id: "free-form",
    title: "자유형 사진",
    description: "일상 사진에서 인물을 찾아 프로필 사진으로 만듭니다.",
    longDescription:
      "여행이나 일상에서 찍은 사진에서도 AI가 인물을 자동으로 감지하여 카카오톡, 인스타그램 등 SNS에 적합한 프로필 사진으로 변환해 드립니다.",
    icon: "Wand2",
    useCases: ["카카오톡", "인스타그램", "블로그", "개인 브랜딩"],
    ratios: ["1:1", "4:5"],
    processingSteps: [
      "AI 인물 자동 감지",
      "최적 크롭 영역 제안",
      "배경 블러 또는 제거",
      "SNS 최적화 사이즈 조정",
    ],
  },
];

// ================================================
// Styles Data
// ================================================

export const styles: Style[] = [
  {
    id: "natural",
    title: "자연스럽게",
    description: "과도한 보정 없이 자연스러운 피부톤과 색감을 유지합니다.",
    icon: "Leaf",
    color: "emerald",
  },
  {
    id: "professional",
    title: "전문적으로",
    description: "비즈니스에 적합한 단정하고 신뢰감 있는 이미지로 보정합니다.",
    icon: "Briefcase",
    color: "blue",
  },
  {
    id: "bright",
    title: "밝고 화사하게",
    description: "전체적으로 밝고 생기있는 색감으로 화사하게 보정합니다.",
    icon: "Sun",
    color: "amber",
  },
  {
    id: "studio",
    title: "스튜디오 느낌",
    description: "스튜디오 조명처럼 균일한 빛과 깔끔한 배경으로 보정합니다.",
    icon: "Camera",
    color: "purple",
  },
  {
    id: "luxury",
    title: "고급스럽게",
    description: "프리미엄 화보 느낌의 세련되고 고급스러운 톤으로 보정합니다.",
    icon: "Sparkles",
    color: "rose",
  },
];

// ================================================
// Use Cases Data
// ================================================

export const useCases: UseCase[] = [
  { id: "명함", label: "명함", icon: "CreditCard", color: "slate" },
  { id: "이력서", label: "이력서", icon: "FileText", color: "blue" },
  { id: "LinkedIn", label: "LinkedIn", icon: "Linkedin", color: "sky" },
  { id: "카카오톡", label: "카카오톡", icon: "MessageCircle", color: "yellow" },
  { id: "인스타그램", label: "인스타그램", icon: "Instagram", color: "pink" },
  {
    id: "강사 프로필",
    label: "강사 프로필",
    icon: "BookOpen",
    color: "violet",
  },
  {
    id: "회사 홈페이지",
    label: "회사 홈페이지",
    icon: "Building2",
    color: "teal",
  },
  {
    id: "포트폴리오",
    label: "포트폴리오",
    icon: "FolderOpen",
    color: "orange",
  },
];

// ================================================
// Pricing Plans
// ================================================

export const pricingPlans = [
  {
    name: "무료",
    price: "₩0",
    period: "영구 무료",
    description: "기본 프로필 보정을 경험해보세요",
    features: [
      "월 3회 보정",
      "1080px 해상도",
      "기본 보정 스타일 2가지",
      "JPG 다운로드",
    ],
    notIncluded: ["고해상도 출력", "배경 제거", "우선 처리"],
    cta: "무료로 시작",
    popular: false,
    color: "gray",
  },
  {
    name: "프로",
    price: "₩9,900",
    period: "/월",
    description: "전문적인 프로필 사진이 필요한 분들을 위해",
    features: [
      "월 50회 보정",
      "4K 해상도",
      "모든 보정 스타일",
      "PNG/JPG/WebP 다운로드",
      "배경 제거",
      "우선 처리",
    ],
    notIncluded: [],
    cta: "프로 시작하기",
    popular: true,
    color: "violet",
  },
  {
    name: "비즈니스",
    price: "₩29,900",
    period: "/월",
    description: "팀과 기업을 위한 대용량 보정 플랜",
    features: [
      "무제한 보정",
      "4K 해상도",
      "모든 보정 스타일",
      "모든 형식 다운로드",
      "배경 제거",
      "API 연동",
      "팀 멤버 5명",
      "전용 지원",
    ],
    notIncluded: [],
    cta: "비즈니스 문의",
    popular: false,
    color: "indigo",
  },
];
