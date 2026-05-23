// ── AI 보정 프롬프트 생성 로직 ──────────────────────────────
// 사용자 요구사항에 따라 강도·옵션 → 최종 프롬프트 자동 조립

export type RetouchStrength = 'natural' | 'standard' | 'polished';

export interface RetouchOptions {
  strength: RetouchStrength;
  skinIntensity: 1 | 2 | 3 | 4 | 5;   // 1=최소, 5=강하게
  smileIntensity: 1 | 2 | 3;           // 1=거의없음, 3=자연스럽게
  backgroundColor: 'gray' | 'beige' | 'bluegray' | 'white';
  brightness: -2 | -1 | 0 | 1 | 2;    // -2=어둡게, 0=원본, 2=밝게
  cropRatio: '1:1' | '4:5' | '2:3';
}

// ── 기본값 ──────────────────────────────────────────────────
export const DEFAULT_OPTIONS: RetouchOptions = {
  strength: 'standard',
  skinIntensity: 3,
  smileIntensity: 2, // 중장년 프로필 기본값: 표정만 살짝 밝게
  backgroundColor: 'gray',
  brightness: 0,
  cropRatio: '1:1',
};

// ── 배경 색상 설명 ──────────────────────────────────────────
const BG_COLOR_PROMPTS: Record<RetouchOptions['backgroundColor'], string> = {
  gray:     'clean soft light gray background',
  beige:    'clean warm beige background',
  bluegray: 'clean soft blue-gray background',
  white:    'clean pure white background',
};

// ── 피부 보정 강도 설명 ─────────────────────────────────────
function getSkinRetouch(intensity: number): string {
  if (intensity <= 1) return 'very minimal skin retouching, keep all natural skin texture and pores';
  if (intensity === 2) return 'light skin retouching, reduce only the most visible blemishes while keeping realistic skin texture';
  if (intensity === 3) return 'natural skin retouching, reduce blemishes and redness while preserving pores and skin texture';
  if (intensity === 4) return 'moderate skin retouching, smooth uneven skin tone, reduce blemishes and redness while keeping some skin texture';
  return 'clean skin retouching, reduce blemishes, redness, and uneven tone, slightly smoothed but not plastic';
}

// ── 미소 보정 강도 설명 ─────────────────────────────────────
function getSmileAdjustment(intensity: number): string {
  if (intensity <= 1) return 'keep the original expression, do not change the smile';
  if (intensity === 2) return 'very subtle, barely noticeable natural gentle smile, only slightly lift the corners of the mouth';
  return 'gentle natural smile, slightly lift the corners of the mouth and soften the eyes for a friendly professional look';
}

// ── 밝기 조절 설명 ─────────────────────────────────────────
function getBrightnessAdjustment(brightness: number): string {
  if (brightness === -2) return 'slightly darker exposure, moodier lighting';
  if (brightness === -1) return 'slightly reduced brightness, natural shadow';
  if (brightness === 0)  return 'balanced natural exposure';
  if (brightness === 1)  return 'slightly brighter, airy feel, good portrait lighting';
  return 'brighter exposure, bright and clean portrait lighting';
}

// ── 강도별 기본 지시 ───────────────────────────────────────
const STRENGTH_BASE: Record<RetouchStrength, string> = {
  natural: `Edit the uploaded portrait photo very lightly and naturally. 
Preserve the person's identity, age appearance, facial structure, hairstyle, clothing, and overall composition exactly as in the original. 
Only reduce the most distracting visible blemishes slightly. Keep the expression the same or with minimal change. 
The result should look almost identical to the original, just slightly cleaner and better lit.`,

  standard: `Edit the uploaded portrait photo naturally. 
Preserve the person's identity, age appearance, facial structure, hairstyle, clothing, and overall composition. 
Retouch the face lightly, improve overall portrait quality with balanced exposure, natural skin tone, slightly clearer eyes, and soft studio lighting. 
Clean up minor stray hairs only when they are distracting. 
The result should look like a realistic professional profile photo, not AI-generated.`,

  polished: `Edit the uploaded portrait photo for a polished studio profile look. 
Preserve the person's identity, age appearance, facial structure, hairstyle, and clothing exactly. 
Retouch the skin for a clean and even complexion, improve lighting to a soft studio feel, and create a professional portrait quality. 
Keep all facial proportions and features true to the original. 
The result should look like a high-quality professional studio portrait photo.`,
};

// ── 공통 고정 지시 ─────────────────────────────────────────
const COMMON_CONSTRAINTS = `Preserve the person's eyes, nose, mouth, face shape, and body proportions exactly as in the original. 
Keep the hairstyle and clothing unchanged. 
Do not make the skin look plastic or overly smooth. 
Keep realistic skin texture, pores, and natural facial lines.`;

// ── 양수 프롬프트 생성 ─────────────────────────────────────
export function buildPositivePrompt(options: RetouchOptions): string {
  const {
    strength, skinIntensity, smileIntensity,
    backgroundColor, brightness,
  } = options;

  const bgPrompt    = BG_COLOR_PROMPTS[backgroundColor];
  const skinPrompt  = getSkinRetouch(skinIntensity);
  const smilePrompt = getSmileAdjustment(smileIntensity);
  const brightPrompt= getBrightnessAdjustment(brightness);

  return [
    STRENGTH_BASE[strength],
    COMMON_CONSTRAINTS,
    `Skin: ${skinPrompt}.`,
    `Expression: ${smilePrompt}.`,
    `Lighting: ${brightPrompt}.`,
    `Background: Replace the background with a ${bgPrompt} that harmonizes with the clothing.`,
    `Final quality: professional profile photo, photorealistic, high quality, not AI-generated looking.`,
  ].join('\n');
}

// ── 음수 프롬프트 생성 ─────────────────────────────────────
export function buildNegativePrompt(options: RetouchOptions): string {
  const smileNeg = options.smileIntensity <= 1
    ? 'Do not change the expression at all. '
    : 'Do not create an exaggerated smile. ';

  const skinNeg = options.skinIntensity >= 4
    ? ''
    : 'Do not remove all skin texture. Do not create plastic skin. ';

  return [
    'Do not change the person\'s identity.',
    'Do not make the person look younger than the original.',
    'Do not reshape the face.',
    'Do not enlarge the eyes.',
    'Do not change the hairstyle, clothing, accessories, or body shape.',
    skinNeg,
    smileNeg,
    'Do not add heavy makeup.',
    'Do not over-sharpen.',
    'Do not make the image look synthetic, cartoonish, glamorous, or artificial.',
    'Do not change the ethnicity or facial features.',
    'ugly, deformed, disfigured, watermark, text, logo, bad anatomy, extra limbs, mutation',
  ].filter(Boolean).join(' ');
}

// ── instruct-pix2pix: image_guidance_scale ────────────────
// 높을수록 원본을 더 보존 (1.0=프롬프트 중심, 2.5=원본 중심)
export function getImageGuidanceScale(strength: RetouchStrength): number {
  return { natural: 2.0, standard: 1.5, polished: 1.1 }[strength];
}

// ── (하위 호환) prompt_strength — 더 이상 사용 안 함 ────────
export function getPromptStrength(strength: RetouchStrength): number {
  return { natural: 0.35, standard: 0.50, polished: 0.65 }[strength];
}

// ── 크롭 비율 → width/height ───────────────────────────────
// SDXL GPU 메모리 제한: 768px 이하 권장 (1024px → CUDA OOM 발생)
export function getCropDimensions(ratio: RetouchOptions['cropRatio']): { width: number; height: number } {
  return {
    '1:1': { width: 768, height: 768 },
    '4:5': { width: 640, height: 800 },
    '2:3': { width: 512, height: 768 },
  }[ratio];
}
