import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Star,
  ChevronDown,
} from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden hero-gradient py-20 md:py-32">
      {/* Decorative background blobs */}
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #ec4899, transparent)" }}
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, #a855f7 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8 animate-fade-in"
            style={{
              background: "rgba(124, 58, 237, 0.08)",
              border: "1px solid rgba(124, 58, 237, 0.2)",
              color: "#7c3aed",
            }}
          >
            <Sparkles className="w-4 h-4" />
            AI 기반 자동 프로필 보정 서비스
            <span className="px-2 py-0.5 text-xs rounded-full font-bold text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
              Beta
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6 animate-fade-in-up">
            원본 사진을 프로필 사진으로,{" "}
            <br className="hidden sm:block" />
            <span className="gradient-text">몇 초 만에.</span>
          </h1>

          {/* Sub Copy */}
          <p className="text-lg md:text-xl text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto animate-fade-in-up animation-delay-100">
            얼굴 위주 사진, 상반신 사진, 전신 사진까지
            <br className="hidden sm:block" />
            목적에 맞게 AI가 자동으로 보정해드립니다.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in-up animation-delay-200">
            <Link
              href="/editor"
              id="hero-cta-start"
              className="btn-primary text-base px-8 py-4 group"
            >
              <Zap className="w-5 h-5" />
              사진 보정 시작하기
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/pricing"
              id="hero-cta-pricing"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
            >
              요금제 보기
            </Link>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-400 animate-fade-in-up animation-delay-300">
            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-1 font-medium text-gray-600">4.9/5</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300" />
            <span>2,400+ 명이 사용 중</span>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300" />
            <span>무료 체험 가능</span>
          </div>
        </div>

        {/* Demo Preview Image */}
        <div className="mt-16 md:mt-20 relative max-w-5xl mx-auto animate-fade-in-up animation-delay-400">
          {/* Floating card previews */}
          <div className="relative flex gap-4 md:gap-6 justify-center items-end">
            {/* Before card */}
            <div className="w-40 sm:w-52 md:w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-lg p-2 border border-gray-100">
                <div
                  className="w-full aspect-square rounded-xl overflow-hidden relative"
                  style={{ background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)" }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-medium">원본 사진</span>
                  </div>
                </div>
                <div className="pt-2 pb-1 px-1 text-center">
                  <span className="text-xs font-semibold text-gray-400">BEFORE</span>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-md animate-float"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
              >
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* After card */}
            <div className="w-40 sm:w-52 md:w-64 flex-shrink-0">
              <div
                className="bg-white rounded-2xl p-2 border-2"
                style={{
                  borderColor: "rgba(124, 58, 237, 0.4)",
                  boxShadow: "0 8px 32px rgba(124, 58, 237, 0.2)",
                }}
              >
                <div
                  className="w-full aspect-square rounded-xl overflow-hidden relative"
                  style={{ background: "linear-gradient(135deg, #ede9fe, #ddd6fe)" }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-violet-400">
                    <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center mb-2">
                      <Sparkles className="w-6 h-6 text-violet-600" />
                    </div>
                    <span className="text-xs font-semibold text-violet-700">AI 보정 완료</span>
                  </div>
                </div>
                <div className="pt-2 pb-1 px-1 text-center">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "#7c3aed" }}
                  >
                    AFTER ✨
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center mt-12 animate-bounce">
          <ChevronDown className="w-6 h-6 text-gray-300" />
        </div>
      </div>
    </section>
  );
}
