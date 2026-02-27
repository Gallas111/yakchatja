'use client';

import { SIDO_LIST } from '@/lib/utils';

interface Props {
  sido: string;
  sigungu: string;
  onlyOpen: boolean;
  nightOnly: boolean;
  sundayOnly: boolean;
  onSidoChange: (v: string) => void;
  onSigunguChange: (v: string) => void;
  onOnlyOpenChange: (v: boolean) => void;
  onNightOnlyChange: (v: boolean) => void;
  onSundayOnlyChange: (v: boolean) => void;
  onSearch: () => void;
  loading: boolean;
}

export default function SearchFilter({
  sido,
  sigungu,
  onlyOpen,
  nightOnly,
  sundayOnly,
  onSidoChange,
  onSigunguChange,
  onOnlyOpenChange,
  onNightOnlyChange,
  onSundayOnlyChange,
  onSearch,
  loading,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex gap-2">
        <select
          value={sido}
          onChange={(e) => {
            onSidoChange(e.target.value);
            onSigunguChange('');
          }}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">시/도 선택</option>
          {SIDO_LIST.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="text"
          value={sigungu}
          onChange={(e) => onSigunguChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && sido) onSearch();
          }}
          placeholder="군/구 입력"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterToggle
          label="영업중만"
          active={onlyOpen}
          onChange={onOnlyOpenChange}
          emoji="🟢"
        />
        <FilterToggle
          label="야간약국"
          active={nightOnly}
          onChange={onNightOnlyChange}
          emoji="🌙"
        />
        <FilterToggle
          label="일요일 영업"
          active={sundayOnly}
          onChange={onSundayOnlyChange}
          emoji="📅"
        />
      </div>

      <button
        onClick={onSearch}
        disabled={loading || !sido}
        className="w-full py-2.5 rounded-lg bg-green-600 text-white font-medium text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '검색중...' : '약국 검색'}
      </button>
    </div>
  );
}

function FilterToggle({
  label,
  active,
  onChange,
  emoji,
}: {
  label: string;
  active: boolean;
  onChange: (v: boolean) => void;
  emoji: string;
}) {
  return (
    <button
      onClick={() => onChange(!active)}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-green-100 text-green-700 border border-green-300'
          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
      }`}
    >
      {emoji} {label}
    </button>
  );
}
