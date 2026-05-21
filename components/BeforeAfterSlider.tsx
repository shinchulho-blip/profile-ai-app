"use client";

import { useEffect, useRef, useState } from "react";

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = "원본",
  afterLabel  = "AI 보정",
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderX, setSliderX] = useState(50); // 0~100 퍼센트
  const isDragging = useRef(false);

  const updateSlider = (clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderX(pct);
  };

  // 마우스 이벤트
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    updateSlider(e.clientX);
  };
  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (isDragging.current) updateSlider(e.clientX); };
    const onUp   = () => { isDragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  // 터치 이벤트
  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    updateSlider(e.touches[0].clientX);
  };
  useEffect(() => {
    const onMove = (e: TouchEvent) => { if (isDragging.current) updateSlider(e.touches[0].clientX); };
    const onEnd  = () => { isDragging.current = false; };
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl select-none cursor-col-resize"
      style={{ aspectRatio: "1 / 1", background: "#111" }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* 보정본 (뒤쪽 전체) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterUrl}
        alt="보정본"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        draggable={false}
      />

      {/* 원본 (앞쪽, 왼쪽 일부만 보임) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${sliderX}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeUrl}
          alt="원본"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: `${100 / (sliderX / 100)}%`, maxWidth: "none" }}
          draggable={false}
        />
      </div>

      {/* 슬라이더 라인 */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
        style={{ left: `${sliderX}%`, transform: "translateX(-50%)" }}
      >
        {/* 핸들 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-xl flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M6 9L3 6M6 9L3 12M6 9H1" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 9L15 6M12 9L15 12M12 9H17" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* 라벨 */}
      <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md text-xs font-bold bg-black/60 text-white pointer-events-none">
        {beforeLabel}
      </div>
      <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md text-xs font-bold bg-violet-600 text-white pointer-events-none">
        {afterLabel}
      </div>
    </div>
  );
}
