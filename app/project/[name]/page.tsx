"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Download, Trash2, Sparkles, Loader2, RefreshCw,
  ImageIcon, CheckCircle2, AlertTriangle,
  CheckSquare, Square, X
} from "lucide-react";
import Header from "@/components/Header";
import UploadZone from "@/components/UploadZone";
import PhotoCard from "@/components/PhotoCard";
import PhotoLightbox from "@/components/PhotoLightbox";
import type { Photo } from "@/types";
import { DEFAULT_OPTIONS } from "@/lib/prompts";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectName = decodeURIComponent(params.name as string);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [enhancingAll, setEnhancingAll] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // 선택 삭제 상태
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 라이트박스
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const totalCount = photos.length;
  const enhancedCount = photos.filter((p) => p.enhancedUrl).length;
  const pendingCount = totalCount - enhancedCount;
  const selectedCount = selectedIds.size;

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/photos`);
      const data = await res.json();
      if (data.success) {
        setPhotos(data.data ?? []);
        // 사진 목록이 새로고침되면 선택 초기화
        setSelectedIds(new Set());
      }
    } catch {
      setStatusMsg("사진 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [projectName]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  // ── 체크박스 선택 ─────────────────────────────────────────
  const toggleSelect = (publicId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(publicId)) next.delete(publicId);
      else next.add(publicId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === totalCount) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map((p) => p.publicId)));
    }
  };

  // ── 선택 삭제 ────────────────────────────────────────────
  const handleDeleteSelected = async () => {
    if (selectedCount === 0) return;
    if (!confirm(`선택한 ${selectedCount}장을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

    setDeletingSelected(true);
    try {
      // 원본 public_id + 대응 enhanced public_id 수집
      const toDelete: string[] = [];
      for (const id of selectedIds) {
        toDelete.push(id);
        const photo = photos.find((p) => p.publicId === id);
        if (photo?.enhancedPublicId) toDelete.push(photo.enhancedPublicId);
      }

      const res = await fetch("/api/photos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicIds: toDelete }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`✓ ${selectedCount}장이 삭제되었습니다.`);
        setTimeout(() => setStatusMsg(null), 3000);
        await fetchPhotos();
      } else {
        setStatusMsg(data.error ?? "삭제 실패");
      }
    } catch {
      setStatusMsg("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingSelected(false);
    }
  };

  // ── 전체 AI 보정 (1장씩 순차 처리)
  const handleEnhanceAll = async () => {
    const toEnhance = photos.filter((p) => !p.enhancedUrl);
    if (toEnhance.length === 0) return;
    setEnhancingAll(true);
    setStatusMsg(`0 / ${toEnhance.length}장 AI 보정 중... (장당 20~45초 소요)`);

    let done = 0;
    for (const photo of toEnhance) {
      try {
        await fetch("/api/retouch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicId: photo.publicId,
            projectName,
            filename: photo.filename,
            options: DEFAULT_OPTIONS,
          }),
        });
      } catch { /* 개별 실패 무시 */ }
      done++;
      setStatusMsg(`${done} / ${toEnhance.length}장 AI 보정 완료...`);
    }

    await fetchPhotos();
    setEnhancingAll(false);
    setStatusMsg(`✓ ${done}장 AI 보정 완료! 각 카드의 before/after를 확인하세요.`);
    setTimeout(() => setStatusMsg(null), 5000);
  };


  // ── 다운로드 ─────────────────────────────────────────────
  const handleDownload = async (type: "all" | "originals" | "enhanced") => {
    setDownloading(type);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/download?type=${type}`);
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

  // ── 프로젝트 전체 삭제 ───────────────────────────────────
  const handleDeleteProject = async () => {
    if (!confirm(`"${projectName}" 프로젝트의 모든 사진을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    setDeletingProject(true);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) router.push("/");
      else setStatusMsg(data.error ?? "삭제 실패");
    } catch {
      setStatusMsg("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingProject(false);
    }
  };

  return (
    <>
      <Header projectName={params.name as string} />

      {/* 라이트박스 */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── 프로젝트 헤더 ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">{projectName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                총 {totalCount}장
                {enhancedCount > 0 && <span className="text-violet-600 ml-2">· 보정완료 {enhancedCount}장</span>}
                {pendingCount > 0 && <span className="text-amber-600 ml-2">· 미보정 {pendingCount}장</span>}
              </p>
            </div>
            {totalCount > 0 && (
              <div className="w-full sm:w-48">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>보정 진행률</span>
                  <span>{Math.round((enhancedCount / totalCount) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(enhancedCount / totalCount) * 100}%`, background: "linear-gradient(90deg, #7c3aed, #a855f7)" }}
                  />
                </div>
              </div>
            )}
          </div>
          {statusMsg && (
            <div className="mt-3 p-3 rounded-lg bg-violet-50 border border-violet-100 text-sm text-violet-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 flex-shrink-0" />{statusMsg}
            </div>
          )}
        </div>

        {/* ── 선택 삭제 바 (선택 시에만 표시) ──────────────── */}
        {selectedCount > 0 && (
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-violet-600" />
              <span className="text-sm font-bold text-violet-800">{selectedCount}장 선택됨</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-violet-600 hover:bg-violet-100 transition-colors"
              >
                <X className="w-4 h-4" /> 선택 해제
              </button>
              <button
                id="delete-selected-btn"
                onClick={handleDeleteSelected}
                disabled={deletingSelected}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deletingSelected ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                선택 삭제 ({selectedCount}장)
              </button>
            </div>
          </div>
        )}

        {/* ── 일괄 작업 컨트롤 ─────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex flex-wrap items-center gap-3">
            {/* 전체 AI 보정 */}
            <button
              id="enhance-all-btn"
              onClick={handleEnhanceAll}
              disabled={enhancingAll || pendingCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
            >
              {enhancingAll ? <><Loader2 className="w-4 h-4 animate-spin" />AI 보정 중...</> : <><Sparkles className="w-4 h-4" />AI 전체 보정 ({pendingCount}장)</>}
            </button>

            <div className="h-6 w-px bg-gray-200 hidden sm:block" />

            {/* 다운로드 */}
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

            <div className="h-6 w-px bg-gray-200 hidden sm:block" />

            {/* 전체 선택 토글 */}
            {totalCount > 0 && (
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {selectedIds.size === totalCount ? <CheckSquare className="w-4 h-4 text-violet-600" /> : <Square className="w-4 h-4" />}
                전체 선택
              </button>
            )}

            <button onClick={fetchPhotos} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors">
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
              전체 삭제
            </button>
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* ── 업로드 ──────────────────────────────────── */}
          <div>
            <UploadZone projectName={projectName} onUploadComplete={fetchPhotos} />
          </div>

          {/* ── 갤러리 ──────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-violet-600" />
                사진 갤러리
                {totalCount > 0 && <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{totalCount}</span>}
              </h3>
              {enhancedCount === totalCount && totalCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />전체 보정 완료
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
                  {photos.map((photo, idx) => (
                    <PhotoCard
                      key={photo.publicId}
                      photo={photo}
                      projectName={projectName}
                      selected={selectedIds.has(photo.publicId)}
                      onToggleSelect={() => toggleSelect(photo.publicId)}
                      onEnhanced={fetchPhotos}
                      onClickPhoto={() => setLightboxIndex(idx)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {totalCount > 50 && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>사진이 {totalCount}장입니다. 다운로드 후 <strong>전체 삭제</strong>로 저장 공간을 확보하세요.</p>
          </div>
        )}
      </main>
    </>
  );
}
