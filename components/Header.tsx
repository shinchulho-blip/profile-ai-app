import Link from "next/link";
import { Camera, Home } from "lucide-react";

interface HeaderProps {
  projectName?: string;
}

export default function Header({ projectName }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-gray-900 leading-none block">상상우리</span>
              <span className="text-xs text-violet-600 font-medium leading-none">프로필 보정 도구</span>
            </div>
          </Link>

          {/* 현재 프로젝트 표시 */}
          {projectName && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 rounded-lg border border-violet-100">
              <span className="text-xs text-violet-500 font-medium">현재 프로젝트</span>
              <span className="text-sm font-bold text-violet-800">{decodeURIComponent(projectName)}</span>
            </div>
          )}

          {/* 홈 버튼 */}
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">프로젝트 목록</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
