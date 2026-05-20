"use client";

import { useRef, useState, useCallback } from "react";
import { ChevronsLeftRight } from "lucide-react";

interface BeforeAfterPreviewProps {
  beforeImage: string;
  afterImage: string;
}

export default function BeforeAfterPreview({
  beforeImage,
  afterImage,
}: BeforeAfterPreviewProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updateSlider = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    updateSlider(e.clientX);

    const handleMouseMove = (ev: MouseEvent) => {
      if (isDragging.current) updateSlider(ev.clientX);
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    updateSlider(e.touches[0].clientX);

    const handleTouchMove = (ev: TouchEvent) => {
      if (isDragging.current) updateSlider(ev.touches[0].clientX);
    };
    const handleTouchEnd = () => {
      isDragging.current = false;
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);
  };

  return (
    <div className="w-full space-y-3">
      {/* Labels */}
      <div className="flex justify-between text-xs font-semibold">
        <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600">원본</span>
        <span
          className="px-3 py-1 rounded-full text-white"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
        >
          AI 보정 ✨
        </span>
      </div>

      {/* Compare Container */}
      <div
        ref={containerRef}
        className="before-after-container w-full select-none cursor-ew-resize"
        style={{ aspectRatio: "1 / 1", maxHeight: "400px" }}
        aria-label="원본과 보정본 비교 슬라이더"
        role="slider"
        aria-valuenow={sliderPosition}
        aria-valuemin={5}
        aria-valuemax={95}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* After image (full) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterImage}
          alt="AI 보정 결과 사진"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: "brightness(1.08) contrast(1.05) saturate(1.1)",
          }}
          draggable={false}
        />

        {/* Before image (clip) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={beforeImage}
            alt="원본 사진"
            className="absolute inset-0 h-full object-cover"
            style={{ width: `${(100 / sliderPosition) * 100}%` }}
            draggable={false}
          />
          {/* Grayscale overlay for before */}
          <div className="absolute inset-0 bg-gray-900/10" />
        </div>

        {/* Slider Line */}
        <div
          className="before-after-divider"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Handle */}
          <div className="before-after-handle">
            <ChevronsLeftRight className="w-4 h-4 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Instruction */}
      <p className="text-center text-xs text-gray-400">
        슬라이더를 드래그하여 원본과 보정본을 비교하세요
      </p>
    </div>
  );
}
