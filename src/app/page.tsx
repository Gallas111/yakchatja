'use client';

import { useState, useCallback, useEffect } from 'react';
import Header from '@/components/Header';
import KakaoMap from '@/components/KakaoMap';
import PharmacyList from '@/components/PharmacyList';
import SearchFilter from '@/components/SearchFilter';
import { PharmacyRaw } from '@/lib/pharmacy-api';
import {
  getTodayHours,
  isOpenNow,
  isNightPharmacy,
  isSundayOpen,
  calculateDistance,
} from '@/lib/utils';

export default function Home() {
  const [pharmacies, setPharmacies] = useState<PharmacyRaw[]>([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState<PharmacyRaw[]>([]);
  const [distances, setDistances] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const [userLat, setUserLat] = useState<number>();
  const [userLng, setUserLng] = useState<number>();

  // 필터 상태
  const [sido, setSido] = useState('');
  const [sigungu, setSigungu] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [nightOnly, setNightOnly] = useState(false);
  const [sundayOnly, setSundayOnly] = useState(false);

  // GPS 위치 가져오기
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      },
      (err) => {
        console.warn('위치 정보를 가져올 수 없습니다:', err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // 필터 적용
  const applyFilters = useCallback(
    (data: PharmacyRaw[]) => {
      let result = data;

      if (onlyOpen) {
        result = result.filter((p) => isOpenNow(getTodayHours(p)));
      }
      if (nightOnly) {
        result = result.filter((p) => isNightPharmacy(p));
      }
      if (sundayOnly) {
        result = result.filter((p) => isSundayOpen(p));
      }

      // 거리 계산 및 정렬
      if (userLat && userLng) {
        const distMap = new Map<string, number>();
        result.forEach((p) => {
          const lat = parseFloat(p.wgs84Lat);
          const lng = parseFloat(p.wgs84Lon);
          if (!isNaN(lat) && !isNaN(lng)) {
            distMap.set(p.dutyName, calculateDistance(userLat, userLng, lat, lng));
          }
        });
        setDistances(distMap);

        result.sort((a, b) => {
          const da = distMap.get(a.dutyName) ?? Infinity;
          const db = distMap.get(b.dutyName) ?? Infinity;
          return da - db;
        });
      }

      setFilteredPharmacies(result);
    },
    [onlyOpen, nightOnly, sundayOnly, userLat, userLng]
  );

  // 검색 실행
  const handleSearch = useCallback(async () => {
    if (!sido) return;

    setLoading(true);
    setSelectedId(undefined);

    try {
      const params = new URLSearchParams();
      params.set('Q0', sido);
      if (sigungu) params.set('Q1', sigungu);
      params.set('numOfRows', '200');

      const res = await fetch(`/api/pharmacies?${params}`);
      const data = await res.json();

      if (data.pharmacies) {
        setPharmacies(data.pharmacies);
        applyFilters(data.pharmacies);
      }
    } catch (err) {
      console.error('검색 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [sido, sigungu, applyFilters]);

  // 필터 변경 시 재적용
  useEffect(() => {
    if (pharmacies.length > 0) {
      applyFilters(pharmacies);
    }
  }, [onlyOpen, nightOnly, sundayOnly, pharmacies, applyFilters]);

  const handleMarkerClick = useCallback((pharmacy: PharmacyRaw) => {
    setSelectedId(pharmacy.dutyName);
    const el = document.getElementById('pharmacy-list');
    if (el && window.innerWidth < 768) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-4">
        {/* 검색/필터 */}
        <SearchFilter
          sido={sido}
          sigungu={sigungu}
          onlyOpen={onlyOpen}
          nightOnly={nightOnly}
          sundayOnly={sundayOnly}
          onSidoChange={setSido}
          onSigunguChange={setSigungu}
          onOnlyOpenChange={setOnlyOpen}
          onNightOnlyChange={setNightOnly}
          onSundayOnlyChange={setSundayOnly}
          onSearch={handleSearch}
          loading={loading}
        />

        {/* 지도 + 리스트 */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-[400px] md:h-[600px] md:sticky md:top-20">
            <KakaoMap
              pharmacies={filteredPharmacies}
              userLat={userLat}
              userLng={userLng}
              selectedId={selectedId}
              onMarkerClick={handleMarkerClick}
            />
          </div>

          <div id="pharmacy-list">
            <PharmacyList
              pharmacies={filteredPharmacies}
              distances={distances}
              selectedId={selectedId}
              onSelect={(p) => setSelectedId(p.dutyName)}
              loading={loading}
            />
          </div>
        </div>

        {/* SEO 텍스트 */}
        <section className="mt-12 mb-8 text-center text-gray-400 text-xs space-y-1">
          <p>약찾자 - 내 주변 영업중인 약국을 실시간으로 찾아보세요</p>
          <p>야간약국 | 일요일약국 | 공휴일약국 | 주말약국 | 심야약국</p>
        </section>
      </main>
    </div>
  );
}
