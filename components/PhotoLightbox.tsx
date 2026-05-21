"use client";

import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Eye, EyeOff, Download } from "lucide-react";
import type { Photo } from "@/types";

interface PhotoLightboxProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoLightbox({ photos, initialIndex, onClose }: PhotoLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [showEnhanced, setShowEnhanced] = useState(false);

  const photo = photos[index];
  const hasEnhanced = !!photo?.enhancedUrl;

  // 사진이 바뀌면 enhanced 뷰 초기화
  useEffect(() => {
    setShowEnhanced(false);
  }, [index]);

  const prev = useCallback(() => setIndex((i) => (i > 0 ? i - 1 : photos.length - 1)), [photos.length]);
  const next = useCallback(() => setIndex((i) => (i < photos.length - 1 ? i + 1 : 0)), [photos.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  if (!photo) return null;

  const displayUrl = showEnhanced && photo.enhancedUrl ? photo.enhancedUrl : photo.url;
  const formatBytes = (b: number) => b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)}MB` : `${(b / 1024).toFixed(0)}KB`;

  const handleDownload = async () => {
    const url = displayUrl;
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${photo.filename}${showEnhanced ? "_보정" : "_원본"}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
    >
      {/* 컨텐츠 영역 */}
      <div
        className="relative flex flex-col items-center max-w-[95vw] max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 툴바 */}
        <div className="w-full flex items-center justify-between px-3 py-2 mb-2">
          <div className="flex items-center gap-3">
            {/* 원본/보정 토글 */}
            {hasEnhanced && (
              <button
                onClick={() => setShowEnhanced(!showEnhanced)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  showEnhanced
                    ? "bg-violet-600 text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {showEnhanced ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {showEnhanced ? "보정본" : "원본"}
              </button>
            )}

            {/* 파일 정보 */}
            <div className="text-white/60 text-xs">
              <span className="text-white font-medium">{photo.filename}</span>
              <span className="mx-2">·</span>
              <span>{photo.width} × {photo.height}</span>
              <span className="mx-2">·</span>
              <span>{formatBytes(photo.bytes)}</span>
              <span className="mx-2">·</span>
              <span className="text-white/40">{index + 1} / {photos.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="다운로드"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 이미지 영역 */}
        <div className="relative flex items-center gap-3">
          {/* 이전 버튼 */}
          {photos.length > 1 && (
            <button
              onClick={prev}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* 메인 이미지 */}
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt={photo.filename}
              className="block rounded-lg shadow-2xl"
              style={{
                maxWidth: "80vw",
                maxHeight: "78vh",
                objectFit: "contain",
              }}
            />

            {/* 원본/보정 레이블 */}
            <div className="absolute bottom-3 left-3">
              <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                showEnhanced
                  ? "bg-violet-600 text-white"
                  : "bg-black/60 text-white"
              }`}>
                {showEnhanced ? "보정본" : "원본"}
              </span>
            </div>
          </div>

          {/* 다음 버튼 */}
          {photos.length > 1 && (
            <button
              onClick={next}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* 하단: 보정 미완료 안내 */}
        {!hasEnhanced && (
          <p className="mt-3 text-white/40 text-xs">아직 보정되지 않은 사진입니다.</p>
        )}

        {/* 하단: 원본↔보정 전환 힌트 */}
        {hasEnhanced && (
          <p className="mt-3 text-white/40 text-xs">
            상단 버튼으로 원본 / 보정본을 전환할 수 있습니다 · ← → 키로 이동
          </p>
        )}
      </div>
    </div>
  );
}
