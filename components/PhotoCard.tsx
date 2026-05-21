"use client";

import { useState } from "react";
import { Sparkles, CheckCircle2, Loader2, AlertCircle, Eye, CheckSquare, Square } from "lucide-react";
import type { Photo } from "@/types";

// 스타일별 보정 설명 (사용자에게 보여줄 내용)
const STYLE_LABELS: Record<string, string[]> = {
  professional: ["자동 밝기·선명도 보정", "얼굴 선명도 강화"],
  natural:      ["피부톤 자연 보정", "색상 자동 균형"],
  bright:       ["밝기 +15 향상", "채도 +20 증가", "자동 보정"],
  studio:       ["대비 +15 강화", "선명도 최대화", "자동 보정"],
  luxury:       ["생동감 +30 향상", "선명도 강화", "자동 보정"],
};

interface PhotoCardProps {
  photo: Photo;
  projectName: string;
  style: string;
  selected: boolean;
  onToggleSelect: () => void;
  onEnhanced: () => void;
  onClickPhoto: () => void;
}

export default function PhotoCard({
  photo,
  projectName,
  style,
  selected,
  onToggleSelect,
  onEnhanced,
  onClickPhoto,
}: PhotoCardProps) {
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedStyle, setAppliedStyle] = useState<string | null>(
    photo.enhancedUrl ? "professional" : null
  );

  const isEnhanced = !!photo.enhancedUrl;

  const handleEnhance = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setEnhancing(true);
    setError(null);
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId: photo.publicId,
          projectName,
          style,
          filename: photo.filename,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setAppliedStyle(style);
      onEnhanced();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnhancing(false);
    }
  };

  const formatBytes = (b: number) =>
    b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)}MB` : `${(b / 1024).toFixed(0)}KB`;

  const enhancementItems = appliedStyle ? STYLE_LABELS[appliedStyle] ?? [] : [];

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden group transition-all duration-200 ${
        selected ? "border-violet-400 ring-2 ring-violet-300" : "border-gray-100 hover:border-violet-200"
      }`}
    >
      {/* 사진 영역 */}
      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden cursor-pointer" onClick={onClickPhoto}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.filename}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* 호버 오버레이 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
          <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg" />
        </div>

        {/* 체크박스 */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
          className="absolute top-2 left-2 z-10 transition-all"
          title={selected ? "선택 해제" : "선택"}
        >
          {selected ? (
            <CheckSquare className="w-5 h-5 text-violet-600 drop-shadow" />
          ) : (
            <Square className="w-5 h-5 text-white/80 drop-shadow opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>

        {/* 보정 완료 뱃지 */}
        <div className="absolute top-2 right-2">
          {isEnhanced ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white shadow">
              <CheckCircle2 className="w-3 h-3" />
              완료
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-black/50 text-white">
              원본
            </span>
          )}
        </div>
      </div>

      {/* 정보 영역 */}
      <div className="p-2.5">
        <p className="text-xs font-medium text-gray-700 truncate mb-0.5" title={photo.filename}>
          {photo.filename}
        </p>
        <p className="text-xs text-gray-400 mb-1.5">
          {photo.width}×{photo.height} · {formatBytes(photo.bytes)}
        </p>

        {/* 보정 완료 시 적용 내용 표시 */}
        {isEnhanced && enhancementItems.length > 0 && (
          <div className="mb-1.5 p-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
            <p className="text-xs font-bold text-emerald-700 mb-0.5">✓ 보정 적용 내용</p>
            <ul className="space-y-0.5">
              {enhancementItems.map((item, i) => (
                <li key={i} className="text-xs text-emerald-600 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1 mb-1">
            <AlertCircle className="w-3 h-3" />{error}
          </p>
        )}

        {/* 보정 버튼 */}
        {!isEnhanced ? (
          <button
            onClick={handleEnhance}
            disabled={enhancing}
            className="w-full py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
          >
            {enhancing ? (
              <><Loader2 className="w-3 h-3 animate-spin" />보정 중...</>
            ) : (
              <><Sparkles className="w-3 h-3" />보정하기</>
            )}
          </button>
        ) : (
          <button
            onClick={handleEnhance}
            disabled={enhancing}
            className="w-full py-1.5 rounded-lg text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5 border border-violet-100"
          >
            {enhancing ? (
              <><Loader2 className="w-3 h-3 animate-spin" />재보정 중...</>
            ) : (
              <><Sparkles className="w-3 h-3" />재보정</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
