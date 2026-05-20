"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Download, Trash2, Sparkles, Loader2, RefreshCw,
  ImageIcon, CheckCircle2, AlertTriangle, Settings
} from "lucide-react";
import Header from "@/components/Header";
import UploadZone from "@/components/UploadZone";
import PhotoCard from "@/components/PhotoCard";
import type { Photo } from "@/types";

const STYLE_OPTIONS = [
  { id: "professional", label: "전문적으로" },
  { id: "natural", label: "자연스럽게" },
  { id: "bright", label: "밝고 화사하게" },
  { id: "studio", label: "스튜디오 느낌" },
  { id: "luxury", label: "고급스럽게" },
];

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectName = decodeURIComponent(params.name as string);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [style, setStyle] = useState("professional");
  const [enhancingAll, setEnhancingAll] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const totalCount = photos.length;
  const enhancedCount = photos.filter((p) => p.enhancedUrl).length;
  const pendingCount = totalCount - enhancedCount;

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/photos`);
      const data = await res.json();
      if (data.success) setPhotos(data.data ?? []);
    } catch {
      setStatusMsg("사진 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [projectName]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // ── 전체 보정 ──────────────────────────────────────────────
  const handleEnhanceAll = async () => {
    const toEnhance = photos.filter((p) => !p.enhancedUrl);
    if (toEnhance.length === 0) return;
    setEnhancingAll(true);
    setStatusMsg(`0 / ${toEnhance.length}장 보정 중...`);

    let done = 0;
    // 2장씩 병렬
    for (let i = 0; i < toEnhance.length; i += 2) {
      const batch = toEnhance.slice(i, i + 2);
      await Promise.all(
        batch.map(async (photo) => {
          try {
            await fetch("/api/enhance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                publicId: photo.publicId,
                projectName,
                style,
                filename: photo.filename,
              }),
            });
          } catch { /* 개별 실패 무시, 계속 진행 */ }
          done++;
          setStatusMsg(`${done} / ${toEnhance.length}장 보정 완료...`);
        })
      );
    }

    await fetchPhotos();
    setEnhancingAll(false);
    setStatusMsg(`✓ ${done}장 보정이 완료되었습니다.`);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // ── 다운로드 ───────────────────────────────────────────────
  const handleDownload = async (type: "all" | "originals" | "enhanced") => {
    setDownloading(type);
    try {
      const url = `/api/projects/${encodeURIComponent(projectName)}/download?type=${type}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("다운로드 실패");
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${projectName}_${type}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      setStatusMsg("다운로드 중 오류가 발생했습니다.");
    } finally {
      setDownloading(null);
    }
  };

  // ── 프로젝트 삭제 ──────────────────────────────────────────
  const handleDeleteProject = async () => {
    if (!confirm(`"${projectName}" 프로젝트의 모든 사진을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    setDeletingProject(true);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.push("/");
      } else {
        setStatusMsg(data.error ?? "삭제 실패");
      }
    } catch {
      setStatusMsg("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingProject(false);
    }
  };

  return (
    <>
      <Header projectName={params.name as string} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── 프로젝트 헤더 ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">{projectName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                총 {totalCount}장
                {enhancedCount > 0 && (
                  <span className="text-violet-600 ml-2">· 보정완료 {enhancedCount}장</span>
                )}
                {pendingCount > 0 && (
                  <span className="text-amber-600 ml-2">· 미보정 {pendingCount}장</span>
                )}
              </p>
            </div>

            {/* 진행 바 */}
            {totalCount > 0 && (
              <div className="w-full sm:w-48">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>보정 진행률</span>
                  <span>{Math.round((enhancedCount / totalCount) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(enhancedCount / totalCount) * 100}%`,
                      background: "linear-gradient(90deg, #7c3aed, #a855f7)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 상태 메시지 */}
          {statusMsg && (
            <div className="mt-3 p-3 rounded-lg bg-violet-50 border border-violet-100 text-sm text-violet-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              {statusMsg}
            </div>
          )}
        </div>

        {/* ── 일괄 작업 컨트롤 ─────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex flex-wrap items-center gap-3">

            {/* 보정 스타일 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                {STYLE_OPTIONS.find(s => s.id === style)?.label}
              </button>
            </div>

            {/* 전체 보정 */}
            <button
              id="enhance-all-btn"
              onClick={handleEnhanceAll}
              disabled={enhancingAll || pendingCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
            >
              {enhancingAll ? (
                <><Loader2 className="w-4 h-4 animate-spin" />보정 중...</>
              ) : (
                <><Sparkles className="w-4 h-4" />전체 보정 ({pendingCount}장)</>
              )}
            </button>

            {/* 구분선 */}
            <div className="h-6 w-px bg-gray-200 hidden sm:block" />

            {/* 다운로드 버튼들 */}
            <button
              id="download-enhanced-btn"
              onClick={() => handleDownload("enhanced")}
              disabled={!!downloading || enhancedCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading === "enhanced" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              보정본 다운로드
            </button>

            <button
              id="download-all-btn"
              onClick={() => handleDownload("all")}
              disabled={!!downloading || totalCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading === "all" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              전체 다운로드
            </button>

            {/* 구분선 */}
            <div className="h-6 w-px bg-gray-200 hidden sm:block ml-auto" />

            {/* 새로고침 */}
            <button
              onClick={fetchPhotos}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* 프로젝트 삭제 */}
            <button
              id="delete-project-btn"
              onClick={handleDeleteProject}
              disabled={deletingProject}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {deletingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              삭제
            </button>
          </div>

          {/* 스타일 선택 (토글) */}
          {showSettings && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 mb-2">보정 스타일 선택</p>
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      style === s.id
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-violet-300"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* ── 업로드 영역 ─────────────────────────────── */}
          <div>
            <UploadZone projectName={projectName} onUploadComplete={fetchPhotos} />
          </div>

          {/* ── 사진 갤러리 ─────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-violet-600" />
                사진 갤러리
                {totalCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{totalCount}</span>
                )}
              </h3>
              {enhancedCount === totalCount && totalCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  전체 보정 완료
                </span>
              )}
            </div>

            <div className="p-5">
              {loading ? (
                <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">불러오는 중...</span>
                </div>
              ) : photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">아직 업로드된 사진이 없습니다.</p>
                  <p className="text-xs mt-1">왼쪽 업로드 영역에서 사진을 추가하세요.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {photos.map((photo) => (
                    <PhotoCard
                      key={photo.publicId}
                      photo={photo}
                      projectName={projectName}
                      style={style}
                      onEnhanced={fetchPhotos}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 주의 안내 ─────────────────────────────────── */}
        {totalCount > 50 && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              사진이 {totalCount}장으로 용량이 많습니다.
              다운로드 후 <strong>프로젝트 삭제</strong>를 통해 저장 공간을 확보하세요.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
