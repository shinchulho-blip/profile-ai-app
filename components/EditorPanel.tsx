"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  Grid3X3,
  Target,
  Palette,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditorState, PhotoTypeId, UseCaseId, StyleId } from "@/types";
import PhotoUploader from "./PhotoUploader";
import PhotoTypeSelector from "./PhotoTypeSelector";
import UseCaseSelector from "./UseCaseSelector";
import StyleSelector from "./StyleSelector";
import BeforeAfterPreview from "./BeforeAfterPreview";
import ResultSummary from "./ResultSummary";

const STEPS = [
  { id: 1, label: "사진 업로드", icon: Upload, shortLabel: "업로드" },
  { id: 2, label: "사진 종류 선택", icon: Grid3X3, shortLabel: "종류" },
  { id: 3, label: "사용 목적 선택", icon: Target, shortLabel: "목적" },
  { id: 4, label: "보정 스타일 선택", icon: Palette, shortLabel: "스타일" },
  { id: 5, label: "결과 확인", icon: Sparkles, shortLabel: "결과" },
];

const INITIAL_STATE: EditorState = {
  uploadedImage: null,
  selectedPhotoType: null,
  selectedUseCase: null,
  selectedStyle: null,
  isProcessing: false,
  resultImage: null,
  recommendedRatios: [],
  error: null,
  step: 1,
};

export default function EditorPanel() {
  const [state, setState] = useState<EditorState>(INITIAL_STATE);

  const updateState = useCallback(
    (updates: Partial<EditorState>) => {
      setState((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  /* ── Step navigation ────────────────────────────────────────── */
  const canGoNext = (): boolean => {
    switch (state.step) {
      case 1: return !!state.uploadedImage;
      case 2: return !!state.selectedPhotoType;
      case 3: return !!state.selectedUseCase;
      case 4: return !!state.selectedStyle;
      default: return false;
    }
  };

  const goNext = () => {
    if (state.step < 5) updateState({ step: state.step + 1 });
  };

  const goBack = () => {
    if (state.step > 1) updateState({ step: state.step - 1 });
  };

  /* ── Image upload ───────────────────────────────────────────── */
  const handleImageUploaded = (dataUrl: string) => {
    updateState({ uploadedImage: dataUrl, step: 1 });
  };

  const handleImageClear = () => {
    updateState({
      uploadedImage: null,
      resultImage: null,
      recommendedRatios: [],
      step: 1,
    });
  };

  /* ── AI Enhancement ─────────────────────────────────────────── */
  const handleEnhance = async () => {
    if (
      !state.uploadedImage ||
      !state.selectedPhotoType ||
      !state.selectedUseCase ||
      !state.selectedStyle
    ) {
      updateState({ error: "모든 옵션을 선택해주세요." });
      return;
    }

    updateState({ isProcessing: true, error: null });

    try {
      const response = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: state.uploadedImage,
          photoType: state.selectedPhotoType,
          useCase: state.selectedUseCase,
          style: state.selectedStyle,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "보정 처리 중 오류가 발생했습니다.");
      }

      updateState({
        isProcessing: false,
        resultImage: data.enhancedImageUrl,
        recommendedRatios: data.recommendedRatios,
        step: 5,
      });
    } catch (err) {
      updateState({
        isProcessing: false,
        error:
          err instanceof Error
            ? err.message
            : "알 수 없는 오류가 발생했습니다.",
      });
    }
  };

  /* ── Retry ─────────────────────────────────────────────────── */
  const handleRetry = () => {
    setState({
      ...INITIAL_STATE,
      uploadedImage: state.uploadedImage, // keep the uploaded image
    });
  };

  /* ── Step hints ─────────────────────────────────────────────── */
  const getMissingHint = (): string | null => {
    if (!state.uploadedImage) return "사진을 먼저 업로드해주세요.";
    if (!state.selectedPhotoType) return "사진 종류를 선택해주세요.";
    if (!state.selectedUseCase) return "사용 목적을 선택해주세요.";
    if (!state.selectedStyle) return "보정 스타일을 선택해주세요.";
    return null;
  };

  /* ── Render current step content ─────────────────────────────── */
  const renderStepContent = () => {
    switch (state.step) {
      case 1:
        return (
          <div className="animate-fade-in">
            <p className="text-sm text-gray-500 mb-4">
              보정할 사진을 업로드해주세요. JPG, PNG, WebP, HEIC 형식이
              지원됩니다.
            </p>
            <PhotoUploader
              onImageUploaded={handleImageUploaded}
              uploadedImage={state.uploadedImage}
              onClear={handleImageClear}
            />
          </div>
        );
      case 2:
        return (
          <div className="animate-fade-in">
            <p className="text-sm text-gray-500 mb-4">
              업로드한 사진의 구성에 맞는 종류를 선택해주세요.
            </p>
            <PhotoTypeSelector
              selected={state.selectedPhotoType}
              onSelect={(id: PhotoTypeId) =>
                updateState({ selectedPhotoType: id })
              }
            />
          </div>
        );
      case 3:
        return (
          <div className="animate-fade-in">
            <p className="text-sm text-gray-500 mb-4">
              보정된 사진을 어디에 사용할 예정인지 선택해주세요.
            </p>
            <UseCaseSelector
              selected={state.selectedUseCase}
              onSelect={(id: UseCaseId) =>
                updateState({ selectedUseCase: id })
              }
            />
          </div>
        );
      case 4:
        return (
          <div className="animate-fade-in">
            <p className="text-sm text-gray-500 mb-4">
              원하는 보정 스타일을 선택해주세요.
            </p>
            <StyleSelector
              selected={state.selectedStyle}
              onSelect={(id: StyleId) => updateState({ selectedStyle: id })}
            />
          </div>
        );
      case 5:
        return state.resultImage ? (
          <div className="animate-fade-in">
            <ResultSummary
              photoType={state.selectedPhotoType!}
              useCase={state.selectedUseCase!}
              style={state.selectedStyle!}
              recommendedRatios={state.recommendedRatios}
              resultImage={state.resultImage}
              onRetry={handleRetry}
            />
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* ── Step Progress Bar ────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between overflow-x-auto scrollbar-hide pb-2 gap-1">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = state.step === step.id;
            const isCompleted = state.step > step.id;
            const isAccessible = step.id <= state.step || (step.id === state.step + 1 && canGoNext());

            return (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => {
                    if (isAccessible && step.id !== 5)
                      updateState({ step: step.id });
                  }}
                  disabled={!isAccessible || step.id === 5}
                  className={cn(
                    "flex items-center gap-2 transition-all duration-200",
                    isAccessible && step.id !== 5
                      ? "cursor-pointer"
                      : "cursor-default"
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  <div
                    className={cn(
                      "step-indicator",
                      isActive ? "active" : isCompleted ? "completed" : "pending"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold hidden sm:block",
                      isActive
                        ? "text-violet-700"
                        : isCompleted
                        ? "text-violet-500"
                        : "text-gray-400"
                    )}
                  >
                    {step.label}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold sm:hidden",
                      isActive
                        ? "text-violet-700"
                        : isCompleted
                        ? "text-violet-500"
                        : "text-gray-400"
                    )}
                  >
                    {step.shortLabel}
                  </span>
                </button>

                {/* Connector */}
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-6 sm:w-10 h-0.5 mx-2 transition-colors",
                      isCompleted ? "bg-violet-300" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((state.step - 1) / (STEPS.length - 1)) * 100}%`,
              background: "linear-gradient(90deg, #7c3aed, #a855f7)",
            }}
          />
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
        {/* Left: Photo Preview */}
        <div className="order-2 lg:order-1">
          <div className="card-base p-5 sticky top-24">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4 text-violet-600" />
              사진 미리보기
            </h3>

            {state.step === 5 && state.resultImage && state.uploadedImage ? (
              /* Before/After comparison on step 5 */
              <BeforeAfterPreview
                beforeImage={state.uploadedImage}
                afterImage={state.resultImage}
              />
            ) : state.uploadedImage ? (
              /* Regular preview */
              <div className="relative rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={state.uploadedImage}
                  alt="업로드된 원본 사진 미리보기"
                  className="w-full max-h-72 object-contain"
                />
              </div>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-48 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-gray-400">
                <Upload className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">사진이 업로드되면 여기에 표시됩니다</p>
              </div>
            )}

            {/* Mini summary of selections */}
            {state.step > 1 && (
              <div className="mt-4 space-y-2">
                {state.selectedPhotoType && (
                  <MiniTag label="종류" value={state.selectedPhotoType} />
                )}
                {state.selectedUseCase && (
                  <MiniTag label="목적" value={state.selectedUseCase} />
                )}
                {state.selectedStyle && (
                  <MiniTag label="스타일" value={state.selectedStyle} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Step Content */}
        <div className="order-1 lg:order-2 space-y-6">
          {/* Step Header */}
          <div className="card-base p-6">
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
              >
                {state.step}
              </div>
              <h2 className="text-lg font-extrabold text-gray-900">
                {STEPS[state.step - 1]?.label}
              </h2>
            </div>
            <div className="ml-11">
              {renderStepContent()}
            </div>
          </div>

          {/* Error message */}
          {state.error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {state.error}
            </div>
          )}

          {/* Navigation Buttons */}
          {state.step < 5 && (
            <div className="flex flex-col gap-3">
              {/* Enhance button on step 4 */}
              {state.step === 4 ? (
                <div className="space-y-3">
                  {getMissingHint() && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {getMissingHint()}
                    </div>
                  )}
                  <button
                    id="enhance-btn"
                    onClick={handleEnhance}
                    disabled={
                      state.isProcessing ||
                      !state.uploadedImage ||
                      !state.selectedPhotoType ||
                      !state.selectedUseCase ||
                      !state.selectedStyle
                    }
                    className={cn(
                      "btn-primary w-full justify-center py-4 text-base",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {state.isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        AI 보정 중... (약 2~3초)
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        자동 보정하기
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Normal next/back navigation */
                <div className="flex gap-3">
                  {state.step > 1 && (
                    <button
                      id="step-back-btn"
                      onClick={goBack}
                      className="btn-secondary flex-1 justify-center"
                    >
                      이전
                    </button>
                  )}
                  <button
                    id="step-next-btn"
                    onClick={goNext}
                    disabled={!canGoNext()}
                    className={cn(
                      "btn-primary flex-1 justify-center",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    다음 단계
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Processing Overlay */}
          {state.isProcessing && (
            <div className="card-base p-6 animate-pulse">
              <div className="flex flex-col items-center gap-4 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center processing-ring"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                >
                  <Sparkles className="w-8 h-8 text-white animate-spin" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">
                    AI가 사진을 보정하고 있습니다
                  </p>
                  <p className="text-sm text-gray-500">
                    구도 분석 → 배경 보정 → 피부톤 최적화 → 완성
                  </p>
                </div>
                {/* Processing steps animation */}
                <div className="w-full max-w-xs space-y-2">
                  {[
                    "얼굴 및 인물 감지 중...",
                    "배경 최적화 중...",
                    "색감 및 밝기 보정 중...",
                  ].map((step, i) => (
                    <div
                      key={step}
                      className="flex items-center gap-2 text-xs text-gray-500"
                      style={{ animationDelay: `${i * 0.5}s` }}
                    >
                      <div className="w-3 h-3 rounded-full bg-violet-200 flex-shrink-0 animate-pulse" />
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Small tag for showing current selections in sidebar */
function MiniTag({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-400 font-medium">{label}</span>
      <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-semibold border border-violet-100">
        {value}
      </span>
    </div>
  );
}
