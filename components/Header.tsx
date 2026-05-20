"use client";

import Link from "next/link";
import { Camera, Menu, X, Sparkles } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-violet-200 transition-shadow">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold gradient-text tracking-tight">
              ProfileAI
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              홈
            </Link>
            <Link
              href="/editor"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              사진 보정
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              요금제
            </Link>
          </nav>

          {/* CTA + Mobile Menu */}
          <div className="flex items-center gap-3">
            <Link
              href="/editor"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
              }}
            >
              <Sparkles className="w-4 h-4" />
              무료로 시작
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="메뉴 열기"
            >
              {menuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md px-4 py-4 flex flex-col gap-3 animate-fade-in">
          <Link
            href="/"
            className="text-sm font-medium text-gray-700 hover:text-violet-700 py-2 transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            홈
          </Link>
          <Link
            href="/editor"
            className="text-sm font-medium text-gray-700 hover:text-violet-700 py-2 transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            사진 보정
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-gray-700 hover:text-violet-700 py-2 transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            요금제
          </Link>
          <Link
            href="/editor"
            className="btn-primary text-sm justify-center mt-2"
            onClick={() => setMenuOpen(false)}
          >
            <Sparkles className="w-4 h-4" />
            무료로 시작
          </Link>
        </div>
      )}
    </header>
  );
}
