'use client';

import { useState, useCallback, useEffect } from 'react';
import Header from '@/components/Header';
import KakaoMap from '@/components/KakaoMap';
import PharmacyList from '@/components/PharmacyList';
import SearchFilter from '@/components/SearchFilter';
import { PharmacyRaw } from '@/lib/pharmacy-api';
import { useFavorites } from '@/hooks/useFavorites';
import {
  getTodayHours,
  isOpenNow,
  isNightPharmacy,
  isSundayOpen,
  isHolidayOpen,
  calculateDistance,
  SIDO_LIST,
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
  const [dong, setDong] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [nightOnly, setNightOnly] = useState(false);
  const [sundayOnly, setSundayOnly] = useState(false);
  const [holidayOnly, setHolidayOnly] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [focusUser, setFocusUser] = useState(false);
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  // URL 파라미터로 초기화 (공유 링크 진입 시 자동 검색)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sidoParam = params.get('sido') || '';
    if (!sidoParam) return;

    const sigunguParam = params.get('sigungu') || '';
    const dongParam = params.get('dong') || '';
    const openParam = params.get('open') !== '0'; // 기본값 true, '0'일 때만 false
    const nightParam = params.get('night') === '1';
    const sunParam = params.get('sun') === '1';
    const holParam = params.get('hol') === '1';

    setSido(sidoParam);
    setSigungu(sigunguParam);
    setDong(dongParam);
    setOnlyOpen(openParam);
    setNightOnly(nightParam);
    setSundayOnly(sunParam);
    setHolidayOnly(holParam);
    setLoading(true);

    const apiParams = new URLSearchParams();
    apiParams.set('Q0', sidoParam);
    if (sigunguParam) apiParams.set('Q1', sigunguParam);
    apiParams.set('numOfRows', '200');

    fetch(`/api/pharmacies?${apiParams}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.pharmacies) {
          setPharmacies(data.pharmacies);
          let result = [...data.pharmacies];
          if (dongParam.trim()) result = result.filter((p) => p.dutyAddr?.includes(dongParam.trim()));
          if (openParam) result = result.filter((p) => isOpenNow(getTodayHours(p)));
          if (nightParam) result = result.filter((p) => isNightPharmacy(p));
          if (sunParam) result = result.filter((p) => isSundayOpen(p));
          if (holParam) result = result.filter((p) => isHolidayOpen(p));
          setFilteredPharmacies(result);
        }
      })
      .catch((err) => console.error('URL 초기화 검색 실패:', err))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 필터 변경 시 URL 자동 업데이트 (히스토리 쌓지 않음)
  useEffect(() => {
    if (!sido) {
      if (window.location.search) window.history.replaceState(null, '', '/');
      return;
    }
    const params = new URLSearchParams();
    params.set('sido', sido);
    if (sigungu) params.set('sigungu', sigungu);
    if (dong) params.set('dong', dong);
    if (!onlyOpen) params.set('open', '0');
    if (nightOnly) params.set('night', '1');
    if (sundayOnly) params.set('sun', '1');
    if (holidayOnly) params.set('hol', '1');
    window.history.replaceState(null, '', `/?${params.toString()}`);
  }, [sido, sigungu, dong, onlyOpen, nightOnly, sundayOnly, holidayOnly]);

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

      if (dong.trim()) {
        result = result.filter((p) =>
          p.dutyAddr?.includes(dong.trim())
        );
      }

      if (onlyOpen) {
        result = result.filter((p) => isOpenNow(getTodayHours(p)));
      }
      if (nightOnly) {
        result = result.filter((p) => isNightPharmacy(p));
      }
      if (sundayOnly) {
        result = result.filter((p) => isSundayOpen(p));
      }
      if (holidayOnly) {
        result = result.filter((p) => isHolidayOpen(p));
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
    [dong, onlyOpen, nightOnly, sundayOnly, holidayOnly, userLat, userLng]
  );

  // 검색 실행
  const handleSearch = useCallback(async () => {
    if (!sido) return;

    setLoading(true);
    setSelectedId(undefined);
    setFocusUser(false);

    try {
      const params = new URLSearchParams();
      params.set('Q0', sido);
      if (sigungu) params.set('Q1', sigungu);
      params.set('numOfRows', '200');

      const res = await fetch(`/api/pharmacies?${params}`);
      const data = await res.json();

      if (data.pharmacies) {
        setPharmacies(data.pharmacies);
        setDong('');
        applyFilters(data.pharmacies);
      }
    } catch (err) {
      console.error('검색 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [sido, sigungu, applyFilters]);

  // 내 주변 약국 찾기 (역지오코딩)
  const handleNearbySearch = useCallback(async () => {
    if (!userLat || !userLng) {
      alert('위치 정보를 가져올 수 없습니다. 브라우저에서 위치 접근을 허용해주세요.');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kakao = (window as any).kakao;
    if (!kakao?.maps?.services) {
      alert('지도 서비스가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setNearbyLoading(true);
    setLoading(true);
    setSelectedId(undefined);
    setFocusUser(true);

    try {
      const geocoder = new kakao.maps.services.Geocoder();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const region = await new Promise<any>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        geocoder.coord2RegionCode(userLng, userLat, (result: any[], status: string) => {
          if (status === kakao.maps.services.Status.OK && result.length > 0) {
            // region_type 'H' (행정동) 우선, 없으면 첫 번째
            const adminRegion = result.find((r: { region_type: string }) => r.region_type === 'H') || result[0];
            resolve(adminRegion);
          } else {
            reject(new Error('위치를 주소로 변환할 수 없습니다.'));
          }
        });
      });

      const newSido = region.region_1depth_name;
      const newSigungu = region.region_2depth_name;

      // SIDO_LIST에 매칭되는지 확인 (부분 일치 포함)
      const matchedSido = SIDO_LIST.find(s => s === newSido) ||
        SIDO_LIST.find(s => newSido.includes(s.replace(/특별자치|광역|특별/, '').slice(0, 2)));

      if (!matchedSido) {
        alert(`지원하지 않는 지역입니다: ${newSido}`);
        return;
      }

      setSido(matchedSido);
      setSigungu(newSigungu || '');

      // 상태 변경을 기다리지 않고 직접 API 호출
      const params = new URLSearchParams();
      params.set('Q0', matchedSido);
      if (newSigungu) params.set('Q1', newSigungu);
      params.set('numOfRows', '200');

      const res = await fetch(`/api/pharmacies?${params}`);
      const data = await res.json();

      if (data.pharmacies) {
        setPharmacies(data.pharmacies);
        setDong('');
        applyFilters(data.pharmacies);
      }
    } catch (err) {
      console.error('내 주변 약국 검색 실패:', err);
      alert('내 주변 약국 검색에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setNearbyLoading(false);
      setLoading(false);
    }
  }, [userLat, userLng, applyFilters]);

  // 주소 검색 결과 선택
  const handleAddressSelect = useCallback(async (
    newSido: string,
    newSigungu: string,
    newDong?: string,
  ) => {
    const matchedSido = SIDO_LIST.find(s => s === newSido) ||
      SIDO_LIST.find(s => newSido.includes(s.replace(/특별자치|광역|특별/, '').slice(0, 2)));

    if (!matchedSido) {
      alert(`지원하지 않는 지역입니다: ${newSido}`);
      return;
    }

    setSido(matchedSido);
    setSigungu(newSigungu || '');
    if (newDong) setDong(newDong);
    setFocusUser(false);
    setLoading(true);
    setSelectedId(undefined);

    try {
      const params = new URLSearchParams();
      params.set('Q0', matchedSido);
      if (newSigungu) params.set('Q1', newSigungu);
      params.set('numOfRows', '200');

      const res = await fetch(`/api/pharmacies?${params}`);
      const data = await res.json();

      if (data.pharmacies) {
        setPharmacies(data.pharmacies);
        if (!newDong) setDong('');
        applyFilters(data.pharmacies);
      }
    } catch (err) {
      console.error('주소 검색 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [applyFilters]);

  // 시군구 선택 시 자동 검색 (읍면동 드롭다운 채우기)
  const handleSigunguChange = useCallback((newSigungu: string) => {
    setSigungu(newSigungu);

    if (sido && newSigungu) {
      setLoading(true);
      setSelectedId(undefined);
      setFocusUser(false);
      setDong('');

      const params = new URLSearchParams();
      params.set('Q0', sido);
      params.set('Q1', newSigungu);
      params.set('numOfRows', '200');

      fetch(`/api/pharmacies?${params}`)
        .then(res => res.json())
        .then(data => {
          if (data.pharmacies) {
            setPharmacies(data.pharmacies);
            applyFilters(data.pharmacies);
          }
        })
        .catch(err => console.error('검색 실패:', err))
        .finally(() => setLoading(false));
    } else {
      setDong('');
    }
  }, [sido, applyFilters]);

  // 필터 변경 시 재적용
  useEffect(() => {
    if (pharmacies.length > 0) {
      applyFilters(pharmacies);
    }
  }, [dong, onlyOpen, nightOnly, sundayOnly, holidayOnly, pharmacies, applyFilters]);

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

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        {/* 내 주변 약국 찾기 버튼 */}
        <button
          onClick={handleNearbySearch}
          disabled={nearbyLoading || loading}
          className="w-full mb-3 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-sm sm:text-base hover:from-green-600 hover:to-emerald-600 active:from-green-700 active:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
        >
          {nearbyLoading ? (
            <>
              <span className="animate-spin">⏳</span> 위치 확인 중...
            </>
          ) : (
            <>
              📍 내 주변 약국 찾기
              {!userLat && <span className="text-xs opacity-75">(위치 허용 필요)</span>}
            </>
          )}
        </button>

        {/* 검색/필터 */}
        <SearchFilter
          sido={sido}
          sigungu={sigungu}
          dong={dong}
          onlyOpen={onlyOpen}
          nightOnly={nightOnly}
          sundayOnly={sundayOnly}
          holidayOnly={holidayOnly}
          onSidoChange={setSido}
          onSigunguChange={handleSigunguChange}
          onDongChange={setDong}
          onOnlyOpenChange={setOnlyOpen}
          onNightOnlyChange={setNightOnly}
          onSundayOnlyChange={setSundayOnly}
          onHolidayOnlyChange={setHolidayOnly}
          onSearch={handleSearch}
          onAddressSelect={handleAddressSelect}
          loading={loading}
        />

        {/* 지도 + 리스트 */}
        <div className="mt-3 sm:mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="order-2 md:order-1 h-[300px] sm:h-[400px] md:h-[600px] md:sticky md:top-20">
            <KakaoMap
              pharmacies={filteredPharmacies}
              userLat={userLat}
              userLng={userLng}
              selectedId={selectedId}
              focusUser={focusUser}
              onMarkerClick={handleMarkerClick}
            />
          </div>

          <div id="pharmacy-list" className="order-1 md:order-2">
            <PharmacyList
              pharmacies={filteredPharmacies}
              distances={distances}
              selectedId={selectedId}
              onSelect={(p) => setSelectedId(p.dutyName)}
              loading={loading}
              favorites={favorites}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />
          </div>
        </div>

        {/* SEO 텍스트 */}
        <section className="mt-8 sm:mt-12 mb-6 sm:mb-8 text-center text-gray-400 text-[11px] sm:text-xs space-y-1">
          <p>약국찾자 - 내 주변 영업중인 약국을 실시간으로 찾아보세요</p>
          <p>야간약국 | 일요일약국 | 공휴일약국 | 주말약국 | 심야약국</p>
        </section>
      </main>
    </div>
  );
}
