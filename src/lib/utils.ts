/** 요일 인덱스 (0=일, 1=월, ..., 6=토) */
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

export interface PharmacyHours {
  open: string; // "HHmm" 형식
  close: string; // "HHmm" 형식
}

/** 공공 API 응답에서 오늘 요일에 맞는 영업시간 추출 */
export function getTodayHours(pharmacy: Record<string, string | undefined>): PharmacyHours | null {
  const now = new Date();
  const day = now.getDay(); // 0=일, 1=월, ..., 6=토

  // API 필드: dutyTime1s/dutyTime1c (월) ~ dutyTime7s/dutyTime7c (일), dutyTime8s/dutyTime8c (공휴일)
  // 매핑: 일=7, 월=1, 화=2, 수=3, 목=4, 금=5, 토=6
  const dayMap: Record<number, number> = {
    0: 7, // 일요일
    1: 1, // 월요일
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
  };

  const idx = dayMap[day];
  const open = pharmacy[`dutyTime${idx}s`];
  const close = pharmacy[`dutyTime${idx}c`];

  if (!open || !close) return null;

  return { open: String(open), close: String(close) };
}

/** "HHmm" 형식 시간을 "HH:MM" 표시용으로 변환 */
export function formatTime(time: string | number): string {
  const str = String(time);
  if (!str || str.length < 3) return '';
  const padded = str.padStart(4, '0');
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}`;
}

/** 현재 시간 기준 영업중인지 확인 */
export function isOpenNow(hours: PharmacyHours | null): boolean {
  if (!hours) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const openPadded = hours.open.padStart(4, '0');
  const closePadded = hours.close.padStart(4, '0');

  const openMinutes = parseInt(openPadded.slice(0, 2)) * 60 + parseInt(openPadded.slice(2, 4));
  let closeMinutes = parseInt(closePadded.slice(0, 2)) * 60 + parseInt(closePadded.slice(2, 4));

  // 자정 넘기는 경우 (예: 09:00 ~ 02:00)
  if (closeMinutes <= openMinutes) {
    closeMinutes += 24 * 60;
    if (currentMinutes < openMinutes) {
      return currentMinutes + 24 * 60 < closeMinutes;
    }
  }

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

/** 야간 약국인지 확인 (22시 이후까지 영업) */
export function isNightPharmacy(pharmacy: Record<string, string | undefined>): boolean {
  for (let i = 1; i <= 7; i++) {
    const close = pharmacy[`dutyTime${i}c`];
    if (close) {
      const padded = String(close).padStart(4, '0');
      const hour = parseInt(padded.slice(0, 2));
      // 22시 이후이거나 자정 넘기는 경우 (00~06시)
      if (hour >= 22 || (hour >= 0 && hour <= 6)) return true;
    }
  }
  return false;
}

/** 일요일/공휴일 영업 약국인지 확인 */
export function isSundayOpen(pharmacy: Record<string, string | undefined>): boolean {
  return !!(pharmacy.dutyTime7s && pharmacy.dutyTime7c);
}

export function isHolidayOpen(pharmacy: Record<string, string | undefined>): boolean {
  return !!(pharmacy.dutyTime8s && pharmacy.dutyTime8c);
}

/** 오늘 요일명 반환 */
export function getTodayName(): string {
  return DAY_NAMES[new Date().getDay()];
}

/** 전체 주간 영업시간 반환 (월~일 + 공휴일) */
export function getWeeklyHours(pharmacy: Record<string, string | undefined>) {
  const labels = ['월', '화', '수', '목', '금', '토', '일', '공휴일'];
  return labels.map((label, i) => {
    const idx = i + 1;
    const open = pharmacy[`dutyTime${idx}s`];
    const close = pharmacy[`dutyTime${idx}c`];
    return {
      label,
      hours: open && close ? { open: String(open), close: String(close) } : null,
    };
  });
}

/** 마감까지 / 영업 시작까지 남은 시간 텍스트 반환 */
export function getTimeRemaining(hours: PharmacyHours | null): string {
  if (!hours) return '';

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const openPadded = hours.open.padStart(4, '0');
  const closePadded = hours.close.padStart(4, '0');
  const openMinutes = parseInt(openPadded.slice(0, 2)) * 60 + parseInt(openPadded.slice(2, 4));
  let closeMinutes = parseInt(closePadded.slice(0, 2)) * 60 + parseInt(closePadded.slice(2, 4));

  if (closeMinutes <= openMinutes) closeMinutes += 24 * 60;

  if (isOpenNow(hours)) {
    const adjusted = currentMinutes < openMinutes ? currentMinutes + 24 * 60 : currentMinutes;
    const diff = closeMinutes - adjusted;
    if (diff <= 0) return '';
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h > 0) return m > 0 ? `${h}시간 ${m}분 후 마감` : `${h}시간 후 마감`;
    return `${m}분 후 마감`;
  } else {
    if (currentMinutes < openMinutes) {
      const diff = openMinutes - currentMinutes;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      if (h > 0) return m > 0 ? `${h}시간 ${m}분 후 영업` : `${h}시간 후 영업`;
      return `${m}분 후 영업`;
    }
    return '';
  }
}

/** 거리 계산 (Haversine) - km 반환 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** 거리를 보기 좋게 포맷 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

/** 시도 목록 */
export const SIDO_LIST = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시',
  '광주광역시', '대전광역시', '울산광역시', '세종특별자치시',
  '경기도', '강원특별자치도', '충청북도', '충청남도',
  '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도',
];
