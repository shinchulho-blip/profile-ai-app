import { NextRequest, NextResponse } from "next/server";
import type { EnhanceRequest, EnhanceResponse } from "@/types";
import { getRecommendedRatios } from "@/lib/utils";

// ================================================
// Mock Enhancement API Route
// ================================================
// This is currently a mock implementation.
// To integrate real AI services, replace the mock logic below:
//
// 1. Cloudinary (image optimization + transformations):
//    - Install: npm install cloudinary
//    - Docs: https://cloudinary.com/documentation/node_integration
//    - Use: cloudinary.uploader.upload(imageUrl, { transformation: [...] })
//
// 2. Photoroom API (background removal + studio photos):
//    - Docs: https://www.photoroom.com/api
//    - Use: POST https://sdk.photoroom.com/v1/segment with FormData
//    - Required: PHOTOROOM_API_KEY in env
//
// 3. Replicate API (AI image processing with custom models):
//    - Install: npm install replicate
//    - Docs: https://replicate.com/docs
//    - Use: replicate.run("model-name", { input: { image: imageUrl } })
//    - Required: REPLICATE_API_TOKEN in env
// ================================================

// Style-specific processing descriptions
const STYLE_CORRECTIONS: Record<string, string[]> = {
  natural: ["피부톤 자연스러운 보정", "밝기 미세 조정", "색상 균형 최적화"],
  professional: [
    "배경 정리",
    "색상 채도 조정",
    "얼굴 밝기 강화",
    "선명도 향상",
  ],
  bright: ["전체 밝기 증가", "피부 화사하게", "하이라이트 강조", "채도 향상"],
  studio: [
    "조명 균일화",
    "배경 흰색 보정",
    "그림자 제거",
    "스튜디오 느낌 색감",
  ],
  luxury: ["프리미엄 컬러 그레이딩", "피부 디테일 향상", "배경 고급 처리"],
};

// Photo type specific processing
const PHOTO_TYPE_CORRECTIONS: Record<string, string[]> = {
  closeup: ["얼굴 중심 크롭", "어깨 구도 최적화", "얼굴 비율 보정"],
  "upper-body": ["상반신 구도 유지", "배경 블러 처리", "허리선 자동 조정"],
  "full-body": ["전신 구도 확보", "발끝까지 포함", "전체 비율 정렬"],
  "free-form": ["AI 인물 자동 감지", "최적 크롭 자동 제안", "배경 분리 처리"],
};

export async function POST(request: NextRequest) {
  try {
    const body: EnhanceRequest = await request.json();
    const { imageUrl, photoType, useCase, style } = body;

    // ── Validation ──────────────────────────────────────────────────────
    if (!imageUrl || !photoType || !useCase || !style) {
      return NextResponse.json(
        {
          success: false,
          error: "필수 파라미터가 누락되었습니다. (imageUrl, photoType, useCase, style)",
        },
        { status: 400 }
      );
    }

    // ── TODO: Real AI Processing ────────────────────────────────────────
    // Replace the mock below with actual API calls.
    //
    // Example with Replicate:
    // const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    // const output = await replicate.run("tencentarc/photomaker:...", {
    //   input: { input_image: imageUrl, style_name: style }
    // });
    //
    // Example with Photoroom:
    // const formData = new FormData();
    // formData.append("image_file_b64", imageBase64);
    // const response = await fetch("https://sdk.photoroom.com/v1/segment", {
    //   method: "POST",
    //   headers: { "x-api-key": process.env.PHOTOROOM_API_KEY! },
    //   body: formData,
    // });
    //
    // Example with Cloudinary:
    // const result = await cloudinary.uploader.upload(imageUrl, {
    //   transformation: [
    //     { width: 1000, height: 1000, gravity: "face", crop: "fill" },
    //     { effect: "improve", enhance: "redeye" },
    //   ],
    // });
    // ────────────────────────────────────────────────────────────────────

    // Simulate processing delay (mock)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Build mock response
    const recommendedRatios = getRecommendedRatios(photoType, useCase);
    const appliedCorrections = [
      ...(PHOTO_TYPE_CORRECTIONS[photoType] || []),
      ...(STYLE_CORRECTIONS[style] || []),
    ];

    const response: EnhanceResponse = {
      success: true,
      // In mock mode, return the original image URL.
      // Replace with actual enhanced image URL from AI service.
      enhancedImageUrl: imageUrl,
      recommendedRatios,
      message: `보정이 완료되었습니다. ${appliedCorrections.length}가지 보정이 적용되었습니다.`,
      metadata: {
        processingTime: 2000,
        appliedCorrections,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[/api/enhance] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "이미지 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        code: "PROCESSING_ERROR",
      },
      { status: 500 }
    );
  }
}

// Only POST method is supported
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
