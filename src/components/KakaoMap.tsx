'use client';

import { useEffect, useRef, useCallback } from 'react';
import { PharmacyRaw } from '@/lib/pharmacy-api';
import { getTodayHours, isOpenNow, formatTime } from '@/lib/utils';

declare global {
  interface Window {
    kakao: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

interface Props {
  pharmacies: PharmacyRaw[];
  userLat?: number;
  userLng?: number;
  selectedId?: string;
  onMarkerClick?: (pharmacy: PharmacyRaw) => void;
}

export default function KakaoMap({ pharmacies, userLat, userLng, selectedId, onMarkerClick }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlaysRef = useRef<any[]>([]);

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.kakao?.maps) return;

    const centerLat = userLat || 37.5665;
    const centerLng = userLng || 126.978;

    const options = {
      center: new window.kakao.maps.LatLng(centerLat, centerLng),
      level: 5,
    };

    const map = new window.kakao.maps.Map(mapRef.current, options);
    mapInstanceRef.current = map;

    // 사용자 위치 마커
    if (userLat && userLng) {
      const userPosition = new window.kakao.maps.LatLng(userLat, userLng);
      new window.kakao.maps.Marker({
        map,
        position: userPosition,
        title: '내 위치',
      });
    }
  }, [userLat, userLng]);

  // 카카오맵 SDK 로드
  useEffect(() => {
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!kakaoKey) {
      console.warn('카카오맵 API 키가 설정되지 않았습니다.');
      return;
    }

    if (window.kakao?.maps) {
      initMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`;
    script.async = true;
    script.onerror = (e) => {
      console.error('카카오맵 SDK 로드 실패:', e);
    };
    script.onload = () => {
      window.kakao.maps.load(() => {
        initMap();
      });
    };
    document.head.appendChild(script);
  }, [initMap]);

  // 마커 업데이트
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.kakao?.maps) return;

    // 기존 마커/오버레이 제거
    markersRef.current.forEach((m) => m.setMap(null));
    overlaysRef.current.forEach((o) => o.setMap(null));
    markersRef.current = [];
    overlaysRef.current = [];

    const bounds = new window.kakao.maps.LatLngBounds();
    let hasValidCoord = false;

    if (userLat && userLng) {
      bounds.extend(new window.kakao.maps.LatLng(userLat, userLng));
      hasValidCoord = true;
    }

    pharmacies.forEach((p) => {
      const lat = parseFloat(p.wgs84Lat);
      const lng = parseFloat(p.wgs84Lon);
      if (isNaN(lat) || isNaN(lng)) return;

      const position = new window.kakao.maps.LatLng(lat, lng);
      bounds.extend(position);
      hasValidCoord = true;

      const todayHours = getTodayHours(p);
      const open = isOpenNow(todayHours);

      // 커스텀 마커 이미지
      const markerColor = open ? '#16a34a' : '#9ca3af';
      const markerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40"><path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${markerColor}"/><circle cx="14" cy="14" r="7" fill="white"/><text x="14" y="18" text-anchor="middle" font-size="12" fill="${markerColor}">💊</text></svg>`;
      const markerImage = new window.kakao.maps.MarkerImage(
        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markerSvg)}`,
        new window.kakao.maps.Size(28, 40),
        { offset: new window.kakao.maps.Point(14, 40) }
      );

      const marker = new window.kakao.maps.Marker({
        map,
        position,
        title: p.dutyName,
        image: markerImage,
      });

      // 인포윈도우 내용
      const hoursText = todayHours
        ? `${formatTime(todayHours.open)} ~ ${formatTime(todayHours.close)}`
        : '오늘 휴무';

      const content = `
        <div style="padding:8px 12px;font-size:13px;min-width:160px;line-height:1.5;">
          <strong style="color:#111">${p.dutyName}</strong><br/>
          <span style="color:${open ? '#16a34a' : '#9ca3af'};font-weight:600">
            ${open ? '● 영업중' : '● 영업종료'}
          </span>
          <span style="color:#666;margin-left:6px">${hoursText}</span><br/>
          ${p.dutyTel1 ? `<a href="tel:${p.dutyTel1}" style="color:#2563eb;text-decoration:none">📞 ${p.dutyTel1}</a>` : ''}
        </div>
      `;

      const overlay = new window.kakao.maps.CustomOverlay({
        content: `<div style="background:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);border:1px solid #e5e7eb;">${content}</div>`,
        position,
        yAnchor: 1.3,
      });

      window.kakao.maps.event.addListener(marker, 'click', () => {
        overlaysRef.current.forEach((o) => o.setMap(null));
        overlay.setMap(map);
        onMarkerClick?.(p);
      });

      markersRef.current.push(marker);
      overlaysRef.current.push(overlay);

      // 선택된 약국이면 오버레이 표시
      if (selectedId && p.dutyName === selectedId) {
        overlay.setMap(map);
        map.setCenter(position);
      }
    });

    if (hasValidCoord && pharmacies.length > 0) {
      map.setBounds(bounds);
    }
  }, [pharmacies, selectedId, userLat, userLng, onMarkerClick]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-gray-200">
      <div ref={mapRef} className="w-full h-full" />
      {!process.env.NEXT_PUBLIC_KAKAO_MAP_KEY && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
          카카오맵 API 키를 설정해주세요
        </div>
      )}
    </div>
  );
}
