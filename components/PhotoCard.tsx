"use client";

import { useState } from "react";
import { Sparkles, CheckCircle2, Loader2, AlertCircle, Eye } from "lucide-react";
import type { Photo } from "@/types";

interface PhotoCardProps {
  photo: Photo;
  projectName: string;
  style: string;
  onEnhanced: () => void;
}

export default function PhotoCard({ photo, projectName, style, onEnhanced }: PhotoCardProps) {
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  const isEnhanced = !!photo.enhancedUrl;

  const handleEnhance = async () => {
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
      onEnhanced();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnhancing(false);
    }
  };

  const formatBytes = (b: number) => {
    if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)}MB`;
    return `${(b / 1024).toFixed(0)}KB`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group">
      {/* 사진 영역 */}
      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={showCompare && photo.enhancedUrl ? photo.enhancedUrl : photo.url}
          alt={photo.filename}
          className="w-full h-full object-cover transition-all duration-300"
        />

        {/* 상태 뱃지 */}
        <div className="absolute top-2 left-2">
          {isEnhanced ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white shadow">
              <CheckCircle2 className="w-3 h-3" />
              보정완료
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800/70 text-white">
              원본
            </span>
          )}
        </div>

        {/* 비교 토글 (보정완료 시) */}
        {isEnhanced && (
          <button
            onClick={() => setShowCompare(!showCompare)}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            title={showCompare ? "원본 보기" : "보정본 보기"}
          >
            <Eye className="w-3.5 h-3.5 text-white" />
          </button>
        )}

        {/* 원본/보정 전환 표시 */}
        {isEnhanced && (
          <div className="absolute bottom-0 left-0 right-0 py-1 text-center text-xs font-medium bg-black/40 text-white">
            {showCompare ? "보정본" : "원본"} 보는 중
          </div>
        )}
      </div>

      {/* 정보 영역 */}
      <div className="p-3">
        <p className="text-xs font-medium text-gray-700 truncate mb-1" title={photo.filename}>
          {photo.filename}
        </p>
        <p className="text-xs text-gray-400">
          {photo.width} × {photo.height} · {formatBytes(photo.bytes)}
        </p>

        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3" />{error}
          </p>
        )}

        {/* 보정 버튼 */}
        {!isEnhanced && (
          <button
            onClick={handleEnhance}
            disabled={enhancing}
            className="mt-2 w-full py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
          >
            {enhancing ? (
              <><Loader2 className="w-3 h-3 animate-spin" />보정 중...</>
            ) : (
              <><Sparkles className="w-3 h-3" />보정하기</>
            )}
          </button>
        )}

        {isEnhanced && (
          <button
            onClick={handleEnhance}
            disabled={enhancing}
            className="mt-2 w-full py-1.5 rounded-lg text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5 border border-violet-100"
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
