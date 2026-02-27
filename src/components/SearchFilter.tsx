'use client';

import { SIDO_LIST } from '@/lib/utils';

interface Props {
  sido: string;
  sigungu: string;
  dong: string;
  onlyOpen: boolean;
  nightOnly: boolean;
  sundayOnly: boolean;
  holidayOnly: boolean;
  onSidoChange: (v: string) => void;
  onSigunguChange: (v: string) => void;
  onDongChange: (v: string) => void;
  onOnlyOpenChange: (v: boolean) => void;
  onNightOnlyChange: (v: boolean) => void;
  onSundayOnlyChange: (v: boolean) => void;
  onHolidayOnlyChange: (v: boolean) => void;
  onSearch: () => void;
  loading: boolean;
}

export default function SearchFilter({
  sido,
  sigungu,
  dong,
  onlyOpen,
  nightOnly,
  sundayOnly,
  holidayOnly,
  onSidoChange,
  onSigunguChange,
  onDongChange,
  onOnlyOpenChange,
  onNightOnlyChange,
  onSundayOnlyChange,
  onHolidayOnlyChange,
  onSearch,
  loading,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 space-y-3">
      {/* 시/도 선택 */}
      <select
        value={sido}
        onChange={(e) => {
          onSidoChange(e.target.value);
          onSigunguChange('');
        }}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      >
        <option value="">시/도 선택</option>
        {SIDO_LIST.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* 군/구 + 읍면동 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={sigungu}
          onChange={(e) => onSigunguChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && sido) onSearch();
          }}
          placeholder="군/구 입력"
          className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <input
          type="text"
          value={dong}
          onChange={(e) => onDongChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && sido) onSearch();
          }}
          placeholder="읍/면/동 (선택)"
          className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* 필터 토글 - 모바일 2x2 그리드 */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
        <FilterToggle
          label="영업중만"
          active={onlyOpen}
          onChange={onOnlyOpenChange}
          emoji="🟢"
        />
        <FilterToggle
          label="야간약국"
          hint="(22시 이후 마감)"
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
        <FilterToggle
          label="공휴일 영업"
          active={holidayOnly}
          onChange={onHolidayOnlyChange}
          emoji="🎌"
        />
      </div>

      <button
        onClick={onSearch}
        disabled={loading || !sido}
        className="w-full py-3 rounded-lg bg-green-600 text-white font-medium text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '검색중...' : '약국 검색'}
      </button>
    </div>
  );
}

function FilterToggle({
  label,
  hint,
  active,
  onChange,
  emoji,
}: {
  label: string;
  hint?: string;
  active: boolean;
  onChange: (v: boolean) => void;
  emoji: string;
}) {
  return (
    <button
      onClick={() => onChange(!active)}
      className={`px-3 py-2 sm:py-1.5 rounded-full text-sm font-medium transition-colors text-center ${
        active
          ? 'bg-green-100 text-green-700 border border-green-300'
          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
      }`}
    >
      {emoji} {label}
      {hint && (
        <span className="block text-[10px] font-normal opacity-60 leading-tight">{hint}</span>
      )}
    </button>
  );
}
