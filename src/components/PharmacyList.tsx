'use client';

import { useState } from 'react';
import { PharmacyRaw } from '@/lib/pharmacy-api';
import PharmacyCard from './PharmacyCard';

interface Props {
  pharmacies: PharmacyRaw[];
  distances?: Map<string, number>;
  selectedId?: string;
  onSelect?: (pharmacy: PharmacyRaw) => void;
  loading?: boolean;
  favorites: PharmacyRaw[];
  isFavorite: (p: PharmacyRaw) => boolean;
  onToggleFavorite: (p: PharmacyRaw) => void;
}

export default function PharmacyList({
  pharmacies,
  distances,
  selectedId,
  onSelect,
  loading,
  favorites,
  isFavorite,
  onToggleFavorite,
}: Props) {
  const [activeTab, setActiveTab] = useState<'search' | 'favorites'>('search');

  const displayList = activeTab === 'favorites' ? favorites : pharmacies;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-gray-200 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 탭 */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'search'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          검색 결과
          {pharmacies.length > 0 && (
            <span className="ml-1.5 text-xs text-green-600 font-semibold">
              {pharmacies.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'favorites'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ❤️ 즐겨찾기
          {favorites.length > 0 && (
            <span className="ml-1.5 text-xs text-red-500 font-semibold">
              {favorites.length}
            </span>
          )}
        </button>
      </div>

      {/* 빈 상태 */}
      {displayList.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {activeTab === 'favorites' ? (
            <>
              <p className="text-4xl mb-3">🤍</p>
              <p className="font-medium">즐겨찾기한 약국이 없습니다</p>
              <p className="text-sm mt-1">자주 가는 약국의 하트를 눌러보세요</p>
            </>
          ) : (
            <>
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-medium">검색 결과가 없습니다</p>
              <p className="text-sm mt-1">지역을 선택하고 검색해주세요</p>
            </>
          )}
        </div>
      )}

      {/* 약국 목록 */}
      {displayList.map((p, i) => (
        <PharmacyCard
          key={`${p.dutyName}-${i}`}
          pharmacy={p}
          distance={distances?.get(p.dutyName)}
          isSelected={selectedId === p.dutyName}
          onClick={() => onSelect?.(p)}
          isFavorite={isFavorite(p)}
          onToggleFavorite={() => onToggleFavorite(p)}
        />
      ))}
    </div>
  );
}
