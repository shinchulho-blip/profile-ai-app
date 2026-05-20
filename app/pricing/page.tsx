import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PricingSection from "@/components/PricingSection";
import { HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "요금제 — ProfileAI",
  description:
    "ProfileAI의 무료, 프로, 비즈니스 요금제를 확인하세요. 무료로 시작하고 필요할 때 업그레이드하세요.",
};

const faqs = [
  {
    q: "무료 플랜에서도 보정된 사진을 다운로드할 수 있나요?",
    a: "네, 무료 플랜에서도 월 3회까지 1080px 해상도의 보정된 사진을 다운로드하실 수 있습니다.",
  },
  {
    q: "업로드한 원본 사진은 어떻게 되나요?",
    a: "업로드된 원본 사진은 보정 처리 후 24시간 이내에 서버에서 자동으로 삭제됩니다. 개인정보 보호를 최우선으로 생각합니다.",
  },
  {
    q: "어떤 결제 수단을 지원하나요?",
    a: "신용카드, 체크카드, 카카오페이, 네이버페이 등 주요 결제 수단을 지원합니다.",
  },
  {
    q: "언제든지 플랜을 변경하거나 해지할 수 있나요?",
    a: "네, 언제든지 플랜을 변경하거나 해지할 수 있습니다. 해지 시 다음 결제일까지 서비스를 계속 이용할 수 있습니다.",
  },
  {
    q: "비즈니스 플랜의 API 연동은 어떻게 사용하나요?",
    a: "비즈니스 플랜 구독 후 대시보드에서 API 키를 발급받아 사용하실 수 있습니다. 상세 연동 방법은 API 문서를 참고해주세요.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-white">
        {/* Page Banner */}
        <div
          className="border-b border-gray-100"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.03) 0%, rgba(168,85,247,0.05) 100%)",
          }}
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              모든 플랜, 합리적인 가격
            </h1>
            <p className="text-lg text-gray-500">
              무료로 시작하고 필요할 때 업그레이드하세요.
              <br />
              언제든지 취소 가능, 카드 등록 없이 무료 체험.
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <PricingSection standalone />

        {/* FAQ Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-4">
                <HelpCircle className="w-5 h-5 text-violet-600" />
                <h2 className="text-2xl font-extrabold text-gray-900">
                  자주 묻는 질문
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-gray-50 transition-colors">
                    <span className="font-semibold text-gray-900 text-sm pr-4">
                      {faq.q}
                    </span>
                    <span className="w-6 h-6 rounded-full bg-gray-100 group-open:bg-violet-100 flex items-center justify-center flex-shrink-0 transition-colors text-gray-500 group-open:text-violet-700 font-bold text-sm">
                      +
                    </span>
                  </summary>
                  <div className="px-5 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-4">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>

            <p className="text-center text-sm text-gray-400 mt-10">
              더 궁금한 점이 있으신가요?{" "}
              <a href="mailto:support@profileai.com" className="text-violet-600 hover:underline font-medium">
                고객센터에 문의하세요
              </a>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
