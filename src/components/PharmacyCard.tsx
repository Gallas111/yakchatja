'use client';

import { PharmacyRaw } from '@/lib/pharmacy-api';
import { getTodayHours, isOpenNow, formatTime, formatDistance } from '@/lib/utils';

interface Props {
  pharmacy: PharmacyRaw;
  distance?: number; // km
  isSelected?: boolean;
  onClick?: () => void;
}

export default function PharmacyCard({ pharmacy, distance, isSelected, onClick }: Props) {
  const todayHours = getTodayHours(pharmacy);
  const open = isOpenNow(todayHours);

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pharmacy.dutyTel1) {
      window.location.href = `tel:${pharmacy.dutyTel1}`;
    }
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

  return (
    <div
      onClick={onClick}
      className={`p-3 sm:p-4 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? 'border-green-500 bg-green-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-base sm:text-sm truncate">{pharmacy.dutyName}</h3>
            <span
              className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                open
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {open ? '영업중' : '영업종료'}
            </span>
          </div>

          <p className="text-sm text-gray-500 line-clamp-2 sm:truncate">{pharmacy.dutyAddr}</p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-gray-600">
            {todayHours && (
              <span>
                🕐 {formatTime(todayHours.open)} ~ {formatTime(todayHours.close)}
              </span>
            )}
            {!todayHours && <span className="text-gray-400">오늘 휴무</span>}
            {distance !== undefined && (
              <span className="text-green-600 font-medium">
                📍 {formatDistance(distance)}
              </span>
            )}
          </div>
        </div>
      </div>

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
