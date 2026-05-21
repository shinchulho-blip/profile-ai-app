"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { RetouchOptions } from "@/lib/prompts";
import { DEFAULT_OPTIONS } from "@/lib/prompts";

interface RetouchOptionsProps {
  value: RetouchOptions;
  onChange: (options: RetouchOptions) => void;
}

const STRENGTHS = [
  { id: "natural"  as const, label: "Natural",   desc: "원본 느낌 유지, 최소 보정" },
  { id: "standard" as const, label: "Standard",  desc: "자연스러운 프로필 보정 (기본값)" },
  { id: "polished" as const, label: "Polished",  desc: "스튜디오 느낌의 깔끔한 보정" },
];

const BG_COLORS = [
  { id: "gray"     as const, label: "회색",       color: "#C8C8C8" },
  { id: "beige"    as const, label: "베이지",     color: "#D9C9B0" },
  { id: "bluegray" as const, label: "블루그레이", color: "#9EB3C4" },
  { id: "white"    as const, label: "흰색",       color: "#F5F5F5" },
];

const CROP_RATIOS: { id: RetouchOptions["cropRatio"]; label: string }[] = [
  { id: "1:1", label: "1:1 정방형" },
  { id: "4:5", label: "4:5 세로" },
  { id: "2:3", label: "2:3 세로" },
];

export default function RetouchOptionsPanel({ value, onChange }: RetouchOptionsProps) {
  const [expanded, setExpanded] = useState(false);

  const set = <K extends keyof RetouchOptions>(key: K, val: RetouchOptions[K]) =>
    onChange({ ...value, [key]: val });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* ── 보정 강도 (항상 표시) ─────────────────────────── */}
      <div className="p-5 pb-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">보정 강도</p>
        <div className="grid grid-cols-3 gap-2">
          {STRENGTHS.map((s) => (
            <button
              key={s.id}
              onClick={() => set("strength", s.id)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                value.strength === s.id
                  ? "border-violet-500 bg-violet-50"
                  : "border-gray-100 hover:border-violet-200"
              }`}
            >
              <p className={`text-xs font-bold mb-0.5 ${value.strength === s.id ? "text-violet-700" : "text-gray-700"}`}>
                {s.label}
              </p>
              <p className="text-xs text-gray-400 leading-tight">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── 상세 옵션 토글 ───────────────────────────────── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium">세부 옵션 {expanded ? "접기" : "더보기"}</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-gray-100 pt-4">

          {/* 피부 보정 강도 */}
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-xs font-bold text-gray-600">피부 보정 강도</p>
              <p className="text-xs text-violet-600 font-semibold">
                {["", "최소", "약하게", "보통", "강하게", "최대"][value.skinIntensity]}
              </p>
            </div>
            <input
              type="range" min={1} max={5} step={1}
              value={value.skinIntensity}
              onChange={(e) => set("skinIntensity", Number(e.target.value) as RetouchOptions["skinIntensity"])}
              className="w-full accent-violet-600"
            />
            <div className="flex justify-between text-xs text-gray-300 mt-0.5">
              <span>자연스럽게</span><span>깔끔하게</span>
            </div>
          </div>

          {/* 미소 보정 강도 */}
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-xs font-bold text-gray-600">미소 보정</p>
              <p className="text-xs text-violet-600 font-semibold">
                {["", "없음", "은은하게", "자연스럽게"][value.smileIntensity]}
              </p>
            </div>
            <input
              type="range" min={1} max={3} step={1}
              value={value.smileIntensity}
              onChange={(e) => set("smileIntensity", Number(e.target.value) as RetouchOptions["smileIntensity"])}
              className="w-full accent-violet-600"
            />
            <div className="flex justify-between text-xs text-gray-300 mt-0.5">
              <span>원본 유지</span><span>자연스러운 미소</span>
            </div>
          </div>

          {/* 배경 색상 */}
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">배경 색상</p>
            <div className="flex gap-2">
              {BG_COLORS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => set("backgroundColor", bg.id)}
                  className={`flex flex-col items-center gap-1 flex-1 p-2 rounded-lg border-2 transition-all ${
                    value.backgroundColor === bg.id
                      ? "border-violet-500"
                      : "border-gray-100 hover:border-violet-200"
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-full border border-gray-200 shadow-sm"
                    style={{ background: bg.color }}
                  />
                  <span className="text-xs text-gray-500">{bg.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 밝기 */}
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-xs font-bold text-gray-600">전체 밝기</p>
              <p className="text-xs text-violet-600 font-semibold">
                {["-2", "-1", "0", "+1", "+2"].map((v, i) => i === value.brightness + 2 ? (i === 2 ? "기본" : v) : null).filter(Boolean)[0]}
              </p>
            </div>
            <input
              type="range" min={-2} max={2} step={1}
              value={value.brightness}
              onChange={(e) => set("brightness", Number(e.target.value) as RetouchOptions["brightness"])}
              className="w-full accent-violet-600"
            />
            <div className="flex justify-between text-xs text-gray-300 mt-0.5">
              <span>어둡게</span><span>밝게</span>
            </div>
          </div>

          {/* 크롭 비율 */}
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">크롭 비율</p>
            <div className="flex gap-2">
              {CROP_RATIOS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => set("cropRatio", r.id)}
                  className={`flex-1 py-2 rounded-lg border-2 text-xs font-semibold transition-all ${
                    value.cropRatio === r.id
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-gray-100 text-gray-500 hover:border-violet-200"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* 기본값 초기화 */}
          <button
            onClick={() => onChange(DEFAULT_OPTIONS)}
            className="w-full py-2 text-xs text-gray-400 hover:text-violet-600 transition-colors"
          >
            기본값으로 초기화
          </button>
        </div>
      )}
    </div>
  );
}
