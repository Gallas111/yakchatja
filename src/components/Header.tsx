'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xl sm:text-2xl">💊</span>
          <h1 className="text-lg sm:text-xl font-bold text-green-600">약국찾자</h1>
        </Link>
        <p className="text-xs sm:text-sm text-gray-500">
          내 주변 약국 찾기
        </p>
      </div>
    </header>
  );
}
