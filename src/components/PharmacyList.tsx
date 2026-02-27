'use client';

import { PharmacyRaw } from '@/lib/pharmacy-api';
import PharmacyCard from './PharmacyCard';

interface Props {
  pharmacies: PharmacyRaw[];
  distances?: Map<string, number>;
  selectedId?: string;
  onSelect?: (pharmacy: PharmacyRaw) => void;
  loading?: boolean;
}

export default function PharmacyList({ pharmacies, distances, selectedId, onSelect, loading }: Props) {
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

  if (pharmacies.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-4xl mb-3">🔍</p>
        <p className="font-medium">검색 결과가 없습니다</p>
        <p className="text-sm mt-1">지역을 선택하고 검색해주세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 px-1">
        총 <span className="font-semibold text-green-600">{pharmacies.length}</span>개 약국
      </p>
      {pharmacies.map((p, i) => (
        <PharmacyCard
          key={`${p.dutyName}-${i}`}
          pharmacy={p}
          distance={distances?.get(p.dutyName)}
          isSelected={selectedId === p.dutyName}
          onClick={() => onSelect?.(p)}
        />
      ))}
    </div>
  );
}
