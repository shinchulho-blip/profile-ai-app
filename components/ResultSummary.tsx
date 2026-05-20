"use client";

import { Download, RefreshCw, CheckCircle, Ratio } from "lucide-react";
import { getPhotoTypeLabel, getStyleLabel } from "@/lib/utils";
import type { PhotoTypeId, StyleId, UseCaseId } from "@/types";

interface ResultSummaryProps {
  photoType: PhotoTypeId;
  useCase: UseCaseId;
  style: StyleId;
  recommendedRatios: string[];
  resultImage: string;
  onRetry: () => void;
}

export default function ResultSummary({
  photoType,
  useCase,
  style,
  recommendedRatios,
  resultImage,
  onRetry,
}: ResultSummaryProps) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = resultImage;
    link.download = `profileai-enhanced-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summaryItems = [
    {
      label: "사진 종류",
      value: getPhotoTypeLabel(photoType),
      icon: "📷",
    },
    {
      label: "사용 목적",
      value: useCase,
      icon: "🎯",
    },
    {
      label: "보정 스타일",
      value: getStyleLabel(style),
      icon: "✨",
    },
  ];

  return (
    <div className="w-full space-y-5 animate-scale-in">
      {/* Success Banner */}
      <div
        className="flex items-center gap-3 p-4 rounded-2xl border"
        style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.04))",
          borderColor: "rgba(16,185,129,0.2)",
        }}
      >
        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-800">보정 완료!</p>
          <p className="text-xs text-emerald-600">
            AI가 선택한 옵션에 맞게 사진을 최적화했습니다.
          </p>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          적용된 설정
        </h4>
        <div className="space-y-2.5">
          {summaryItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-sm text-gray-500 flex items-center gap-1.5">
                <span>{item.icon}</span>
                {item.label}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Ratios */}
      {recommendedRatios.length > 0 && (
        <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100">
          <div className="flex items-center gap-2 mb-3">
            <Ratio className="w-4 h-4 text-violet-600" />
            <h4 className="text-xs font-bold text-violet-700 uppercase tracking-wider">
              추천 출력 비율
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {recommendedRatios.map((ratio, i) => (
              <div
                key={ratio}
                className="flex flex-col items-center gap-1.5"
              >
                {/* Ratio visual */}
                <div
                  className="border-2 border-violet-300 rounded-lg bg-white flex items-center justify-center"
                  style={{
                    width: getRatioWidth(ratio),
                    height: getRatioHeight(ratio),
                    minWidth: "36px",
                    minHeight: "36px",
                  }}
                >
                  {i === 0 && (
                    <span className="text-xs text-violet-400">◈</span>
                  )}
                </div>
                <span className="text-xs font-bold text-violet-700">
                  {ratio}
                </span>
                {i === 0 && (
                  <span className="text-xs text-violet-500 font-medium">추천</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <button
          id="result-download-btn"
          onClick={handleDownload}
          className="btn-primary w-full justify-center py-4 text-base"
        >
          <Download className="w-5 h-5" />
          고화질 다운로드
        </button>
        <button
          id="result-retry-btn"
          onClick={onRetry}
          className="btn-secondary w-full justify-center py-3"
        >
          <RefreshCw className="w-4 h-4" />
          다시 보정하기
        </button>
      </div>

      {/* Mock notice */}
      <p className="text-center text-xs text-gray-400 leading-relaxed">
        현재 데모 버전에서는 원본 사진이 그대로 반환됩니다.
        <br />실제 AI 보정은 프로 플랜에서 이용하세요.
      </p>
    </div>
  );
}

/** Returns a pixel width for ratio visualization */
function getRatioWidth(ratio: string): string {
  const parts = ratio.split(":");
  const w = parseInt(parts[0], 10);
  const h = parseInt(parts[1], 10);
  const base = 48;
  return `${Math.round((w / Math.max(w, h)) * base)}px`;
}

/** Returns a pixel height for ratio visualization */
function getRatioHeight(ratio: string): string {
  const parts = ratio.split(":");
  const w = parseInt(parts[0], 10);
  const h = parseInt(parts[1], 10);
  const base = 48;
  return `${Math.round((h / Math.max(w, h)) * base)}px`;
}
