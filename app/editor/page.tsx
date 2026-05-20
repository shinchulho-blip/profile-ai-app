import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EditorPanel from "@/components/EditorPanel";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "사진 보정 에디터 — ProfileAI",
  description:
    "사진을 업로드하고 종류와 목적을 선택하면 AI가 자동으로 프로필 사진을 보정해드립니다.",
};

export default function EditorPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* Page Header Banner */}
        <div
          className="border-b border-gray-100 bg-white"
          style={{
            background:
              "linear-gradient(135deg, rgba(124,58,237,0.03) 0%, rgba(168,85,247,0.05) 100%)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                AI 프로필 보정 에디터
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-12">
              사진을 업로드하고 옵션을 선택하면 AI가 자동으로 최적화해드립니다.
            </p>
          </div>
        </div>

        {/* Editor */}
        <EditorPanel />
      </main>

      <Footer />
    </>
  );
}
