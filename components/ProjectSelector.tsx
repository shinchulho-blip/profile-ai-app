"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, FolderOpen, Loader2, AlertCircle, Camera, ArrowRight, Trash2 } from "lucide-react";
import type { Project } from "@/types";

export default function ProjectSelector() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.success) setProjects(data.data ?? []);
    } catch {
      setError("프로젝트 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    setError(null);
    // 폴더는 첫 사진 업로드 시 자동 생성 — 바로 프로젝트 페이지로 이동
    router.push(`/project/${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">교육 프로젝트 선택</h1>
            <p className="text-sm text-gray-500">새 교육을 만들거나 기존 프로젝트를 열어주세요.</p>
          </div>
        </div>
      </div>

      {/* 새 프로젝트 만들기 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-violet-600" />
          새 교육 프로젝트 만들기
        </h2>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            id="new-project-name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="교육명 입력 (예: 2025년 상반기 리더십 과정)"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
            maxLength={60}
          />
          <button
            type="submit"
            disabled={!newName.trim() || creating}
            id="create-project-btn"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            시작
          </button>
        </form>
        {error && (
          <p className="mt-3 text-sm text-red-500 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> {error}
          </p>
        )}
      </div>

      {/* 기존 프로젝트 목록 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-violet-600" />
            기존 프로젝트
          </h2>
          <button onClick={fetchProjects} className="text-xs text-gray-400 hover:text-violet-600 transition-colors">
            새로고침
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">불러오는 중...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FolderOpen className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">저장된 프로젝트가 없습니다.</p>
            <p className="text-xs mt-1">위에서 새 교육 프로젝트를 만들어 시작하세요.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {projects.map((project) => (
              <li key={project.name}>
                <button
                  onClick={() => router.push(`/project/${encodeURIComponent(project.name)}`)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-violet-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                      <FolderOpen className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{project.name}</p>
                      <p className="text-xs text-gray-500">
                        원본 {project.originalCount}장
                        {project.enhancedCount > 0 && (
                          <span className="ml-2 text-violet-600">· 보정완료 {project.enhancedCount}장</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {project.enhancedCount > 0 && project.enhancedCount >= project.originalCount && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        완료
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 transition-colors" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
