import Link from "next/link";
import { Camera, Github, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-extrabold text-white">
                ProfileAI
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              AI가 당신의 사진을 목적에 맞는 완벽한 프로필 사진으로 자동
              보정해드립니다.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a
                href="#"
                aria-label="Github"
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">서비스</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/editor" className="hover:text-white transition-colors">
                  사진 보정 시작
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  요금제
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  API 문서
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">정보</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  개인정보처리방침
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  이용약관
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  고객센터
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © 2025 ProfileAI. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            Powered by AI · Built with Next.js
          </p>
        </div>
      </div>
    </footer>
  );
}
