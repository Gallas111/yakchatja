'use client';

import { useState } from 'react';
import { PharmacyRaw } from '@/lib/pharmacy-api';
import {
  getTodayHours,
  isOpenNow,
  formatTime,
  formatDistance,
  getWeeklyHours,
  getTimeRemaining,
} from '@/lib/utils';

interface Props {
  pharmacy: PharmacyRaw;
  distance?: number;
  isSelected?: boolean;
  onClick?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function PharmacyCard({
  pharmacy,
  distance,
  isSelected,
  onClick,
  isFavorite,
  onToggleFavorite,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const todayHours = getTodayHours(pharmacy);
  const open = isOpenNow(todayHours);
  const timeRemaining = getTimeRemaining(todayHours);
  const weeklyHours = getWeeklyHours(pharmacy);

  const todayDayIdx = new Date().getDay(); // 0=일
  // API 요일 인덱스 매핑: 월=1~일=7
  const todayApiIdx = todayDayIdx === 0 ? 6 : todayDayIdx - 1; // weeklyHours 배열 인덱스 (0=월~6=일)

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pharmacy.dutyTel1) window.location.href = `tel:${pharmacy.dutyTel1}`;
  };

  const handleDirection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pharmacy.wgs84Lat && pharmacy.wgs84Lon) {
      window.open(
        `https://map.kakao.com/link/to/${encodeURIComponent(pharmacy.dutyName)},${pharmacy.wgs84Lat},${pharmacy.wgs84Lon}`,
        '_blank'
      );
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.();
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((v) => !v);
  };

  return (
    <div
      onClick={onClick}
      className={`p-3 sm:p-4 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? 'border-green-500 bg-green-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-sm'
      }`}
    >
      {/* 헤더: 약국명 + 상태 + 즐겨찾기 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-base sm:text-sm truncate">
              {pharmacy.dutyName}
            </h3>
            <span
              className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {open ? '영업중' : '영업종료'}
            </span>
            {/* 남은 시간 */}
            {timeRemaining && (
              <span
                className={`text-xs font-medium ${
                  open ? 'text-orange-500' : 'text-blue-500'
                }`}
              >
                · {timeRemaining}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500 line-clamp-2 sm:truncate">{pharmacy.dutyAddr}</p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-gray-600">
            {todayHours ? (
              <span>🕐 {formatTime(todayHours.open)} ~ {formatTime(todayHours.close)}</span>
            ) : (
              <span className="text-gray-400">오늘 휴무</span>
            )}
            {distance !== undefined && (
              <span className="text-green-600 font-medium">
                📍 {formatDistance(distance)}
              </span>
            )}
          </div>
        </div>

        {/* 즐겨찾기 버튼 */}
        <button
          onClick={handleFavorite}
          className="shrink-0 p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          <span className="text-xl leading-none">{isFavorite ? '❤️' : '🤍'}</span>
        </button>
      </div>

      {/* 주간 영업시간 펼쳐보기 */}
      <button
        onClick={handleExpand}
        className="mt-2 text-xs text-gray-400 hover:text-green-600 transition-colors flex items-center gap-1"
      >
        <span>{expanded ? '▲' : '▼'}</span>
        <span>주간 영업시간 {expanded ? '접기' : '보기'}</span>
      </button>

      {expanded && (
        <div className="mt-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-1">
          {weeklyHours.map(({ label, hours }, i) => {
            const isToday = i === todayApiIdx;
            return (
              <div
                key={label}
                className={`flex items-center justify-between text-xs py-0.5 ${
                  isToday ? 'font-semibold text-green-700' : 'text-gray-600'
                }`}
              >
                <span className={`w-8 shrink-0 ${isToday ? 'text-green-600' : 'text-gray-400'}`}>
                  {label}{isToday ? ' ★' : ''}
                </span>
                <span>
                  {hours
                    ? `${formatTime(hours.open)} ~ ${formatTime(hours.close)}`
                    : '휴무'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2 mt-3">
        {pharmacy.dutyTel1 && (
          <button
            onClick={handleCall}
            className="flex-1 flex items-center justify-center gap-1 py-2.5 px-3 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 active:bg-blue-200 transition-colors"
          >
            📞 전화
          </button>
        )}
        <button
          onClick={handleDirection}
          className="flex-1 flex items-center justify-center gap-1 py-2.5 px-3 rounded-lg bg-green-50 text-green-600 text-sm font-medium hover:bg-green-100 active:bg-green-200 transition-colors"
        >
          🗺️ 길찾기
        </button>
      </div>
    </div>
  );
}
