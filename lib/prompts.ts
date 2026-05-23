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
  strength: 'natural',
  skinIntensity: 3,
  smileIntensity: 2,
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
  if (intensity <= 1) return 'very minimal skin retouching, preserve pores and natural facial lines';
  if (intensity === 2) return 'lightly reduce only the most visible blemishes while keeping realistic skin texture';
  if (intensity === 3) return 'naturally reduce small blemishes, uneven skin spots, redness, and mild discoloration while preserving realistic skin texture';
  if (intensity === 4) return 'moderately soften uneven tone and visible spots without making skin plastic';
  return 'clean but realistic skin retouching, keep pores and natural age texture';
}

// ── 미소 보정 강도 설명 ─────────────────────────────────────
function getSmileAdjustment(intensity: number): string {
  if (intensity <= 1) return 'keep the original expression, do not change the smile';
  if (intensity === 2) return 'very subtly lift the corners of the mouth for a gentle, warm, professional smile without showing teeth';
  return 'slightly brighter warm professional smile, do not show teeth or reshape the mouth';
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
  natural: `Retouch this portrait naturally and conservatively. Preserve the person's identity, face shape, age impression, clothing, background, lighting, and camera framing. Remove small facial blemishes and uneven skin spots while keeping realistic skin texture. Gently soften the nasolabial folds beside the nose without erasing them completely. Reduce fine lines around the mouth and subtly lift the corners of the mouth to create a gentle, warm, professional smile. Clean up stray flyaway hairs around the head while preserving the original hairstyle and hair texture. Do not make the face look younger, plastic, overly smooth, or like a different person. Do not change the eyes, nose, mouth shape significantly, clothing, jewelry, background, or pose. The final result should look like a natural professional profile photo.`,

  standard: `Retouch this portrait naturally and conservatively. Preserve the person's identity, face shape, age impression, clothing, background, lighting, and camera framing. Remove small facial blemishes, uneven skin spots, mild redness, and discoloration while keeping realistic skin texture. Soften the nasolabial folds beside the nose by about 30 to 50 percent without erasing them completely. Reduce fine lines around the mouth and subtly lift the mouth corners for a gentle, warm, professional smile. Clean up only distracting flyaway hairs while preserving the original hairstyle and hair texture. Keep the result suitable for corporate profiles, resumes, and instructor profile photos.`,

  polished: `Retouch this portrait for a clean but still natural professional profile photo. Preserve identity, face shape, age impression, clothing, jewelry, background, lighting, camera framing, and pose. Reduce blemishes and uneven tone more clearly while keeping real skin texture and natural facial lines. Do not make the person look younger or different. Avoid beauty-filter or glamour-retouch effects.`,
};

// ── 공통 고정 지시 ─────────────────────────────────────────
const COMMON_CONSTRAINTS = `Preserve the person's eyes, nose, mouth position and size, face shape, body proportions, hairstyle, hair length, parting, clothing details, buttons, jewelry, background, lighting, camera framing, and pose. Do not make the person look younger or like a different person. Keep realistic skin texture, pores, and natural age texture.`;

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
    `Background: Preserve the original background as much as possible; if cleanup is necessary, keep it close to ${bgPrompt}.`,
    `Final quality: natural professional profile photo for corporate profiles, resumes, and instructor introductions.`,
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
    'over-smoothed skin, plastic skin, heavy makeup, face reshaping, younger face, different person',
    'exaggerated smile, visible teeth, cartoon style, beauty filter, glamour retouch',
    'changed hairstyle, changed clothing, changed background, distorted facial features',
    'asymmetrical eyes, artificial skin texture, loss of fabric detail',
    'Do not change the person\'s identity, age impression, face outline, eyes, nose, mouth shape, hairstyle, clothing, jewelry, background, pose, or camera framing.',
    skinNeg,
    smileNeg,
    'ugly, deformed, disfigured, watermark, text, logo, bad anatomy, extra limbs, mutation',
  ].filter(Boolean).join(' ');
}

// ── instruct-pix2pix: image_guidance_scale ────────────────
// 높을수록 원본을 더 보존 (1.0=프롬프트 중심, 2.5=원본 중심)
export function getImageGuidanceScale(strength: RetouchStrength): number {
  return { natural: 2.4, standard: 2.0, polished: 1.6 }[strength];
}

// ── (하위 호환) prompt_strength — 더 이상 사용 안 함 ────────
export function getPromptStrength(strength: RetouchStrength): number {
  return { natural: 0.30, standard: 0.48, polished: 0.65 }[strength];
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
