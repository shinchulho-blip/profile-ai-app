import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeatureCards from "@/components/FeatureCards";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";

const howItWorks = [
  {
    step: "01",
    title: "사진 업로드",
    description: "보정할 원본 사진을 업로드합니다. 스마트폰 사진도 OK.",
  },
  {
    step: "02",
    title: "옵션 선택",
    description: "사진 종류, 사용 목적, 보정 스타일을 선택합니다.",
  },
  {
    step: "03",
    title: "AI 자동 보정",
    description: "AI가 구도·배경·밝기·피부톤을 자동으로 최적화합니다.",
  },
  {
    step: "04",
    title: "비교 후 다운로드",
    description: "원본과 보정본을 비교하고 마음에 들면 바로 저장합니다.",
  },
];

const trustBadges = [
  "이력서·명함에 최적화된 구도",
  "SNS용 정사각형 자동 크롭",
  "배경 블러 & 배경 제거",
  "피부톤 자연스럽게 보정",
  "1080p~4K 고해상도 출력",
  "원본 데이터 24시간 내 삭제",
];

export default function HomePage() {
  return (
    <>
      <Header />

      <main>
        {/* Hero */}
        <HeroSection />

        {/* Features */}
        <FeatureCards />

        {/* How It Works */}
        <section className="py-20 md:py-28 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-4"
                style={{
                  background: "rgba(124, 58, 237, 0.08)",
                  color: "#7c3aed",
                  border: "1px solid rgba(124, 58, 237, 0.15)",
                }}
              >
                이용 방법
              </div>
              <h2 className="section-title mb-4">4단계로 완성하는 프로필</h2>
              <p className="section-subtitle">복잡한 편집 없이, 선택만 하면 됩니다.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              {/* Connector line (desktop) */}
              <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-violet-200 via-violet-400 to-violet-200 z-0" />

              {howItWorks.map((item, i) => (
                <div
                  key={i}
                  className="relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 z-10"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-extrabold text-white mb-4"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                    }}
                  >
                    {item.step}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/editor" id="how-cta" className="btn-primary inline-flex text-base px-8 py-4">
                지금 바로 시작하기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-16 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-8">
              ProfileAI가 제공하는 기능
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {trustBadges.map((badge) => (
                <div
                  key={badge}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <CheckCircle className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <PricingSection />

        {/* Final CTA Banner */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div
              className="rounded-3xl p-10 md:p-16 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 60%, #ec4899 100%)",
              }}
            >
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white opacity-5 translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white opacity-5 -translate-x-1/3 translate-y-1/3" />

              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
                  지금 바로 프로필 사진을
                  <br className="hidden sm:block" />
                  업그레이드하세요.
                </h2>
                <p className="text-violet-100 mb-8 text-lg">
                  무료로 시작하고, 3번의 보정을 직접 경험해보세요.
                </p>
                <Link
                  href="/editor"
                  id="final-cta"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-violet-700 bg-white hover:bg-violet-50 transition-colors shadow-lg text-base"
                >
                  무료로 시작하기
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
