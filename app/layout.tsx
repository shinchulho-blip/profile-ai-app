import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProfileAI — AI 프로필 사진 자동 보정",
  description:
    "원본 사진을 업로드하고 사진 종류를 선택하면, AI가 구도·크롭·배경·밝기·피부톤을 자동으로 최적화해주는 프로필 사진 보정 웹앱입니다.",
  keywords: "프로필 사진, AI 보정, 이력서 사진, 명함 사진, 프로필 사진 만들기",
  openGraph: {
    title: "ProfileAI — AI 프로필 사진 자동 보정",
    description: "원본 사진을 프로필 사진으로, 몇 초 만에.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white antialiased">{children}</body>
    </html>
  );
}
