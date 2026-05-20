import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "상상우리 프로필 보정 도구",
  description: "상상우리 내부용 교육생 프로필 사진 일괄 보정 도구",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
