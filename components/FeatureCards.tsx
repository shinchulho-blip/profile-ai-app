import {
  Layers,
  Maximize2,
  Wand2,
  SplitSquareHorizontal,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Layers,
    title: "사진 종류별 자동 최적화",
    description:
      "얼굴·상반신·전신·자유형 등 사진 종류에 따라 구도, 크롭, 배경을 AI가 자동으로 맞춰드립니다.",
    color: "violet",
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
  {
    icon: Maximize2,
    title: "용도별 프로필 사이즈",
    description:
      "명함, 이력서, LinkedIn, 카카오톡, 인스타그램 등 용도에 맞는 최적 출력 비율을 자동으로 추천해드립니다.",
    color: "blue",
    gradient: "from-blue-500 to-cyan-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    icon: Wand2,
    title: "배경 정리와 자연스러운 보정",
    description:
      "배경 블러, 배경 제거, 피부톤 보정, 밝기 조정을 원하는 스타일에 맞게 자동으로 처리해드립니다.",
    color: "emerald",
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    icon: SplitSquareHorizontal,
    title: "원본과 결과 비교",
    description:
      "보정 전후를 나란히 비교하여 어떤 변화가 적용됐는지 확인하고, 마음에 들면 바로 다운로드하세요.",
    color: "rose",
    gradient: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
];

export default function FeatureCards() {
  return (
    <section className="py-20 md:py-28 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-4"
            style={{
              background: "rgba(124, 58, 237, 0.08)",
              color: "#7c3aed",
              border: "1px solid rgba(124, 58, 237, 0.15)",
            }}
          >
            주요 기능
          </div>
          <h2 className="section-title mb-4">
            프로답게, 빠르게, 정확하게
          </h2>
          <p className="section-subtitle max-w-xl mx-auto">
            사진의 종류와 목적에 맞는 최적화된 보정을 단 몇 초 만에 경험하세요.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 fade-in-seq">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className={`card-base p-6 hover:scale-[1.02] transition-all duration-300 border ${feature.border}`}
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.bg}`}
                >
                  <div
                    className={`w-6 h-6 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center`}
                    style={{ padding: "4px" }}
                  >
                    <Icon className="w-full h-full text-white" strokeWidth={2} />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <Link
            href="/editor"
            id="features-cta"
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors group"
          >
            지금 바로 시작해보기
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
