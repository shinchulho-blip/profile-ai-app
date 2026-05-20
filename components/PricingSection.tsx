import { Check, X, Zap, Star } from "lucide-react";
import Link from "next/link";
import { pricingPlans } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function PricingSection({ standalone = false }: { standalone?: boolean }) {
  return (
    <section
      id="pricing"
      className={cn("py-20 md:py-28", standalone ? "bg-white" : "bg-gray-50")}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-4"
            style={{
              background: "rgba(124, 58, 237, 0.08)",
              color: "#7c3aed",
              border: "1px solid rgba(124, 58, 237, 0.15)",
            }}
          >
            <Zap className="w-3.5 h-3.5" />
            요금제
          </div>
          <h2 className="section-title mb-4">
            필요한 만큼만, 합리적으로
          </h2>
          <p className="section-subtitle max-w-xl mx-auto">
            무료로 시작하고, 필요할 때 업그레이드하세요.
            <br />
            언제든지 플랜을 변경하거나 취소할 수 있습니다.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border-2 overflow-hidden transition-all duration-300",
                plan.popular
                  ? "border-violet-400 shadow-2xl shadow-violet-100 scale-105"
                  : "border-gray-100 bg-white hover:border-violet-200 hover:shadow-lg"
              )}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div
                  className="absolute top-0 left-0 right-0 py-1.5 text-center text-xs font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                  }}
                >
                  <Star className="w-3 h-3 inline mr-1 fill-current" />
                  가장 인기
                </div>
              )}

              {/* Card Content */}
              <div
                className={cn(
                  "flex flex-col flex-1 p-7",
                  plan.popular ? "pt-10 bg-white" : "bg-white"
                )}
              >
                {/* Plan name & price */}
                <div className="mb-6">
                  <h3 className="text-lg font-extrabold text-gray-900 mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={cn(
                        "text-4xl font-extrabold",
                        plan.popular ? "gradient-text" : "text-gray-900"
                      )}
                    >
                      {plan.price}
                    </span>
                    <span className="text-sm text-gray-400">{plan.period}</span>
                  </div>
                </div>

                {/* Features list */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                          plan.popular
                            ? "bg-violet-100"
                            : "bg-emerald-50"
                        )}
                      >
                        <Check
                          className={cn(
                            "w-3 h-3",
                            plan.popular ? "text-violet-600" : "text-emerald-600"
                          )}
                          strokeWidth={2.5}
                        />
                      </div>
                      <span className="text-sm text-gray-700 leading-snug">
                        {feature}
                      </span>
                    </li>
                  ))}
                  {plan.notIncluded.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 opacity-40">
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="w-3 h-3 text-gray-400" strokeWidth={2.5} />
                      </div>
                      <span className="text-sm text-gray-500 leading-snug line-through">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href="/editor"
                  id={`pricing-cta-${plan.name}`}
                  className={cn(
                    "w-full py-3.5 rounded-xl text-sm font-bold text-center transition-all duration-200 block",
                    plan.popular
                      ? "btn-primary justify-center"
                      : "border-2 border-gray-200 text-gray-700 hover:border-violet-300 hover:text-violet-700 bg-white"
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ note */}
        <p className="text-center text-sm text-gray-400 mt-10">
          VAT 별도 · 언제든 취소 가능 · 카드 등록 없이 무료 체험
        </p>
      </div>
    </section>
  );
}
