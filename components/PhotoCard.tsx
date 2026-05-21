"use client";

import { useState } from "react";
import {
  Sparkles, CheckCircle2, Loader2, AlertCircle,
  Eye, CheckSquare, Square, X, Download, RefreshCw
} from "lucide-react";
import type { Photo } from "@/types";
import { DEFAULT_OPTIONS, type RetouchOptions } from "@/lib/prompts";
import RetouchOptionsPanel from "@/components/RetouchOptions";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";

interface PhotoCardProps {
  photo: Photo;
  projectName: string;
  selected: boolean;
  onToggleSelect: () => void;
  onEnhanced: () => void;
  onClickPhoto: () => void;
}

export default function PhotoCard({
  photo, projectName, selected, onToggleSelect, onEnhanced, onClickPhoto,
}: PhotoCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [options, setOptions] = useState<RetouchOptions>(DEFAULT_OPTIONS);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(photo.enhancedUrl ?? null);

  const isEnhanced = !!resultUrl;
  const formatBytes = (b: number) =>
    b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)}MB` : `${(b / 1024).toFixed(0)}KB`;

  // ── AI 보정 실행 (비동기 폴링 방식 — Vercel 60초 제한 우회) ──
  const handleRetouch = async () => {
    setProcessing(true);
    setError(null);
    try {
      // 1단계: 예측 시작 (즉시 반환)
      const startRes = await fetch("/api/retouch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId: photo.publicId,
          projectName,
          filename: photo.filename,
          options,
        }),
      });
      const startText = await startRes.text();
      let startData: { success: boolean; predictionId?: string; error?: string };
      try { startData = JSON.parse(startText); }
      catch { throw new Error(`서버 오류 (${startRes.status}): 잠시 후 다시 시도해 주세요.`); }
      if (!startData.success) throw new Error(startData.error ?? '보정 시작 실패');

      const predictionId = startData.predictionId!;
      const params = new URLSearchParams({
        id: predictionId,
        publicId: photo.publicId,
        projectName,
        filename: photo.filename,
      });

      // 2단계: 3초마다 상태 폴링 (최대 90초)
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 3000));

        const statusRes = await fetch(`/api/retouch/status?${params}`);
        const statusText = await statusRes.text();
        let statusData: {
          success: boolean;
          status?: string;
          data?: { url: string };
          error?: string;
        };
        try { statusData = JSON.parse(statusText); }
        catch { throw new Error("상태 확인 중 오류가 발생했습니다."); }

        if (!statusData.success) throw new Error(statusData.error ?? "AI 처리 실패");

        if (statusData.status === "succeeded") {
          setResultUrl(statusData.data!.url);
          onEnhanced();
          return;
        }
        // starting / processing → 계속 폴링
      }
      throw new Error("처리 시간이 초과되었습니다. 다시 시도해 주세요.");

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  // ── 개별 다운로드 ────────────────────────────────────────
  const handleDownload = async (url: string, suffix: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${photo.filename.replace(/\.[^.]+$/, "")}_${suffix}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      {/* ── 카드 ────────────────────────────────────────── */}
      <div className={`bg-white rounded-xl border shadow-sm overflow-hidden group transition-all duration-200 ${
        selected ? "border-violet-400 ring-2 ring-violet-300" : "border-gray-100 hover:border-violet-200"
      }`}>
        {/* 사진 영역 */}
        <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden cursor-pointer" onClick={onClickPhoto}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={photo.filename}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
            <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
          </div>

          {/* 체크박스 */}
          <button onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
            className="absolute top-2 left-2 z-10">
            {selected
              ? <CheckSquare className="w-5 h-5 text-violet-600 drop-shadow" />
              : <Square className="w-5 h-5 text-white/80 drop-shadow opacity-0 group-hover:opacity-100 transition-opacity" />}
          </button>

          {/* 완료 뱃지 */}
          <div className="absolute top-2 right-2">
            {isEnhanced
              ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white shadow">
                  <CheckCircle2 className="w-3 h-3" />AI 보정
                </span>
              : <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-black/50 text-white">원본</span>}
          </div>
        </div>

        {/* 정보 */}
        <div className="p-2.5">
          <p className="text-xs font-medium text-gray-700 truncate mb-0.5">{photo.filename}</p>
          <p className="text-xs text-gray-400 mb-2">{photo.width}×{photo.height} · {formatBytes(photo.bytes)}</p>

          {/* 보정 버튼 */}
          <button
            onClick={() => { setShowModal(true); setError(null); }}
            className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              isEnhanced
                ? "text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-100"
                : "text-white"
            }`}
            style={!isEnhanced ? { background: "linear-gradient(135deg, #7c3aed, #a855f7)" } : undefined}
          >
            <Sparkles className="w-3 h-3" />
            {isEnhanced ? "재보정" : "AI 보정"}
          </button>
        </div>
      </div>

      {/* ── AI 보정 모달 ─────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => !processing && setShowModal(false)}>
          <div
            className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                  AI 프로필 보정
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">{photo.filename}</p>
              </div>
              <button onClick={() => !processing && setShowModal(false)}
                disabled={processing}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors disabled:opacity-30">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 왼쪽: 옵션 패널 */}
              <div className="space-y-4">
                <RetouchOptionsPanel value={options} onChange={setOptions} />

                {/* 보정 실행 버튼 */}
                <button
                  onClick={handleRetouch}
                  disabled={processing}
                  className="w-full py-3.5 rounded-xl text-sm font-extrabold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      AI 보정 중... (20~45초 소요)
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {isEnhanced ? "다시 보정하기" : "AI 보정 시작"}
                    </>
                  )}
                </button>

                {/* 처리 중 안내 */}
                {processing && (
                  <div className="p-3 bg-violet-50 border border-violet-100 rounded-xl text-xs text-violet-700">
                    <p className="font-bold mb-1">🤖 AI가 보정 중입니다</p>
                    <p>얼굴 분석 → 피부 보정 → 배경 변경 순서로 처리됩니다.</p>
                    <p className="mt-1 text-violet-500">보정 강도에 따라 20~60초 소요됩니다.</p>
                  </div>
                )}

                {/* 에러 */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">보정 실패</p>
                      <p>{error}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 오른쪽: 미리보기 */}
              <div className="space-y-4">
                {resultUrl ? (
                  <>
                    <BeforeAfterSlider beforeUrl={photo.url} afterUrl={resultUrl} />
                    <p className="text-xs text-center text-gray-400">← 드래그하여 원본과 비교</p>

                    {/* 다운로드 버튼들 */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleDownload(photo.url, "원본")}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> 원본 저장
                      </button>
                      <button
                        onClick={() => handleDownload(resultUrl, "보정본")}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold text-white transition-all"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                      >
                        <Download className="w-3.5 h-3.5" /> 보정본 저장
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="aspect-square rounded-xl bg-gray-100 flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
                    {processing ? (
                      <>
                        <div className="w-16 h-16 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin mb-4" />
                        <p className="text-sm font-bold text-gray-600">AI 보정 처리 중...</p>
                        <p className="text-xs text-gray-400 mt-1">잠시만 기다려주세요</p>
                      </>
                    ) : (
                      <div className="relative w-full h-full">
                        {/* 원본 미리보기 */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.url} alt="원본" className="w-full h-full object-cover rounded-xl opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                          <div className="text-center">
                            <RefreshCw className="w-10 h-10 text-violet-400 mx-auto mb-2" />
                            <p className="text-sm font-bold text-gray-700">옵션 설정 후</p>
                            <p className="text-sm font-bold text-violet-600">AI 보정 시작</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
