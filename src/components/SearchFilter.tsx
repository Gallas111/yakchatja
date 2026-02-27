'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { SIDO_LIST } from '@/lib/utils';
import { SIGUNGU_MAP } from '@/lib/regions';

interface AddressResult {
  sido: string;
  sigungu: string;
  dong: string;
  display: string;
}

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
  onAddressSelect: (sido: string, sigungu: string, dong?: string) => void;
  dongList: string[];
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
  onAddressSelect,
  dongList,
  loading,
}: Props) {
  const [addressQuery, setAddressQuery] = useState('');
  const [addressResults, setAddressResults] = useState<AddressResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const resultsRef = useRef<HTMLDivElement>(null);

  const sigunguList = sido ? (SIGUNGU_MAP[sido] || []) : [];

  // 카카오 Geocoder로 주소 검색
  const searchAddress = useCallback((query: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kakao = (window as any).kakao;
    if (!kakao?.maps?.services) return;

    const geocoder = new kakao.maps.services.Geocoder();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    geocoder.addressSearch(query, (result: any[], status: string) => {
      if (status === kakao.maps.services.Status.OK && result.length > 0) {
        const seen = new Set<string>();
        const regions: AddressResult[] = [];

        for (const r of result) {
          const addr = r.address;
          if (!addr) continue;
          const key = `${addr.region_1depth_name}|${addr.region_2depth_name}|${addr.region_3depth_name}`;
          if (seen.has(key)) continue;
          seen.add(key);
          regions.push({
            sido: addr.region_1depth_name,
            sigungu: addr.region_2depth_name,
            dong: addr.region_3depth_name,
            display: [addr.region_1depth_name, addr.region_2depth_name, addr.region_3depth_name]
              .filter(Boolean)
              .join(' '),
          });
          if (regions.length >= 5) break;
        }

        setAddressResults(regions);
        setShowResults(regions.length > 0);
      } else {
        setAddressResults([]);
        setShowResults(false);
      }
    });
  }, []);

  // 디바운스 입력
  const handleAddressInput = useCallback((value: string) => {
    setAddressQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setAddressResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(() => searchAddress(value), 300);
  }, [searchAddress]);

  // 결과 선택
  const handleResultClick = useCallback((result: AddressResult) => {
    onAddressSelect(result.sido, result.sigungu, result.dong);
    setAddressQuery('');
    setAddressResults([]);
    setShowResults(false);
  }, [onAddressSelect]);

  // Enter 키 처리
  const handleAddressKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showResults && addressResults.length > 0) {
        // 결과가 있으면 첫 번째 결과 선택
        handleResultClick(addressResults[0]);
      } else if (addressQuery.trim()) {
        // 결과가 없으면 즉시 검색 실행
        if (debounceRef.current) clearTimeout(debounceRef.current);
        searchAddress(addressQuery);
      }
    }
  }, [showResults, addressResults, addressQuery, searchAddress, handleResultClick]);

  // 외부 클릭 시 결과 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 space-y-3">
      {/* 주소 검색 */}
      <div className="relative" ref={resultsRef}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={addressQuery}
            onChange={(e) => handleAddressInput(e.target.value)}
            onKeyDown={handleAddressKeyDown}
            placeholder="주소 검색 (예: 강남구 역삼동, 해운대구)"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        {showResults && addressResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
            {addressResults.map((result, i) => (
              <button
                key={i}
                onClick={() => handleResultClick(result)}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-green-50 active:bg-green-100 transition-colors border-b border-gray-100 last:border-0"
              >
                <span className="text-gray-900">{result.display}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 구분선 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">또는 직접 선택</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* 시/도 선택 */}
      <select
        value={sido}
        onChange={(e) => {
          onSidoChange(e.target.value);
          onSigunguChange('');
          onDongChange('');
        }}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      >
        <option value="">시/도 선택</option>
        {SIDO_LIST.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* 시/군/구 + 읍/면/동 */}
      <div className="flex gap-2">
        <select
          value={sigungu}
          onChange={(e) => onSigunguChange(e.target.value)}
          disabled={!sido || sigunguList.length === 0}
          className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">
            {!sido ? '시/도를 먼저 선택' : sigunguList.length === 0 ? '전체' : '시/군/구 선택'}
          </option>
          {sigunguList.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={dong}
          onChange={(e) => onDongChange(e.target.value)}
          disabled={dongList.length === 0}
          className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">
            {dongList.length === 0 ? '읍/면/동 (검색 후 선택)' : '읍/면/동 전체'}
          </option>
          {dongList.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
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
