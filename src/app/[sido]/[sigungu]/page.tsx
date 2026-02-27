import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchPharmacies, PharmacyRaw } from '@/lib/pharmacy-api';
import { SIGUNGU_MAP } from '@/lib/regions';
import { getTodayHours, isOpenNow, formatTime, getWeeklyHours } from '@/lib/utils';

// 1시간마다 데이터 재검증 (ISR)
export const revalidate = 3600;

interface Props {
  params: Promise<{ sido: string; sigungu: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sido: sidoRaw, sigungu: sigunguRaw } = await params;
  const sido = decodeURIComponent(sidoRaw);
  const sigungu = decodeURIComponent(sigunguRaw);

  return {
    title: `${sigungu} 약국 찾기`,
    description: `${sido} ${sigungu} 전체 약국 목록. 야간약국, 일요일 영업, 공휴일 약국, 영업시간을 한눈에 확인하세요.`,
    alternates: {
      canonical: `https://www.yakchatja.com/${encodeURIComponent(sido)}/${encodeURIComponent(sigungu)}`,
    },
    openGraph: {
      title: `${sigungu} 약국 찾기 | 약국찾자`,
      description: `${sido} ${sigungu} 전체 약국 목록 및 실시간 영업시간 안내`,
      url: `https://www.yakchatja.com/${encodeURIComponent(sido)}/${encodeURIComponent(sigungu)}`,
    },
  };
}

// 빌드 시 주요 지역 사전 생성
export async function generateStaticParams() {
  const params: { sido: string; sigungu: string }[] = [];
  for (const [sido, sigunguList] of Object.entries(SIGUNGU_MAP)) {
    for (const sigungu of sigunguList) {
      params.push({
        sido: encodeURIComponent(sido),
        sigungu: encodeURIComponent(sigungu),
      });
    }
  }
  return params;
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

function WeekBadges({ pharmacy }: { pharmacy: PharmacyRaw }) {
  const weekly = getWeeklyHours(pharmacy);
  // 주말/야간만 배지로 표시
  const sat = weekly[5].hours; // 토
  const sun = weekly[6].hours; // 일
  const holiday = weekly[7].hours; // 공휴일
  const isNight = weekly.slice(0, 7).some((d) => {
    if (!d.hours) return false;
    const h = parseInt(d.hours.close.padStart(4, '0').slice(0, 2));
    return h >= 22 || h <= 6;
  });

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {sat && (
        <span className="px-1.5 py-0.5 rounded text-[11px] bg-blue-50 text-blue-600 font-medium">토영업</span>
      )}
      {sun && (
        <span className="px-1.5 py-0.5 rounded text-[11px] bg-purple-50 text-purple-600 font-medium">일영업</span>
      )}
      {holiday && (
        <span className="px-1.5 py-0.5 rounded text-[11px] bg-orange-50 text-orange-600 font-medium">공휴일</span>
      )}
      {isNight && (
        <span className="px-1.5 py-0.5 rounded text-[11px] bg-indigo-50 text-indigo-600 font-medium">야간</span>
      )}
    </div>
  );
}

export default async function RegionPage({ params }: Props) {
  const { sido: sidoRaw, sigungu: sigunguRaw } = await params;
  const sido = decodeURIComponent(sidoRaw);
  const sigungu = decodeURIComponent(sigunguRaw);

  // 유효성 검증
  const sigunguList = SIGUNGU_MAP[sido];
  if (!sigunguList || (sigunguList.length > 0 && !sigunguList.includes(sigungu))) {
    notFound();
  }

  let pharmacies: PharmacyRaw[] = [];
  try {
    pharmacies = await fetchPharmacies({ Q0: sido, Q1: sigungu, numOfRows: 300 });
  } catch {
    // 데이터 로딩 실패 시 빈 목록으로 표시
  }

  const openCount = pharmacies.filter((p) => isOpenNow(getTodayHours(p))).length;
  const nightCount = pharmacies.filter((p) => {
    const weekly = getWeeklyHours(p);
    return weekly.slice(0, 7).some((d) => {
      if (!d.hours) return false;
      const h = parseInt(d.hours.close.padStart(4, '0').slice(0, 2));
      return h >= 22 || h <= 6;
    });
  }).length;
  const sundayCount = pharmacies.filter((p) => !!(p.dutyTime7s && p.dutyTime7c)).length;

  const todayDayIdx = new Date().getDay(); // 0=일
  const todayLabel = DAY_LABELS[todayDayIdx === 0 ? 6 : todayDayIdx - 1];

  // JSON-LD 구조화 데이터
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${sigungu} 약국 목록`,
    description: `${sido} ${sigungu} 전체 약국 ${pharmacies.length}곳`,
    numberOfItems: pharmacies.length,
    itemListElement: pharmacies.slice(0, 20).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Pharmacy',
        name: p.dutyName,
        address: {
          '@type': 'PostalAddress',
          streetAddress: p.dutyAddr,
          addressRegion: sido,
        },
        telephone: p.dutyTel1 || undefined,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">💊</span>
            <span className="font-bold text-green-600">약국찾자</span>
          </Link>
          <Link href="/" className="text-sm text-green-600 font-medium hover:underline">
            실시간 검색 →
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 브레드크럼 */}
        <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1">
          <Link href="/" className="hover:text-green-600">약국찾자</Link>
          <span>›</span>
          <span>{sido}</span>
          <span>›</span>
          <span className="text-gray-700 font-medium">{sigungu}</span>
        </nav>

        {/* 지역 헤더 */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">
            {sigungu} 약국 찾기
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {sido} {sigungu} 약국 전체 목록
          </p>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: '전체', value: pharmacies.length, color: 'text-gray-900' },
            { label: `${todayLabel}요일 영업중`, value: openCount, color: 'text-green-600' },
            { label: '야간 약국', value: nightCount, color: 'text-indigo-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full mb-6 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
        >
          📍 지금 영업중인 약국 실시간 검색
        </Link>

        {/* 약국 목록 */}
        {pharmacies.length === 0 ? (
          <p className="text-gray-500 text-center py-12">약국 정보를 불러오지 못했습니다.</p>
        ) : (
          <div className="space-y-3">
            {pharmacies.map((p, i) => {
              const todayHours = getTodayHours(p);
              const open = isOpenNow(todayHours);
              return (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-gray-900 text-base">{p.dutyName}</h2>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                            open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {open ? '영업중' : '영업종료'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{p.dutyAddr}</p>
                      {todayHours ? (
                        <p className="text-sm text-gray-600 mt-1">
                          🕐 오늘({todayLabel}) {formatTime(todayHours.open)} ~ {formatTime(todayHours.close)}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 mt-1">오늘 휴무</p>
                      )}
                      {p.dutyTel1 && (
                        <p className="text-sm text-gray-500 mt-0.5">📞 {p.dutyTel1}</p>
                      )}
                      <WeekBadges pharmacy={p} />
                    </div>
                    {p.dutyTel1 && (
                      <a
                        href={`tel:${p.dutyTel1}`}
                        className="shrink-0 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        전화
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 인접 시군구 링크 */}
        {sigunguList && sigunguList.length > 1 && (
          <div className="mt-10">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {sido} 다른 지역 약국 찾기
            </h3>
            <div className="flex flex-wrap gap-2">
              {sigunguList
                .filter((s) => s !== sigungu)
                .map((s) => (
                  <Link
                    key={s}
                    href={`/${encodeURIComponent(sido)}/${encodeURIComponent(s)}`}
                    className="px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors bg-white"
                  >
                    {s}
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* SEO 텍스트 */}
        <section className="mt-10 mb-4 text-gray-400 text-[11px] space-y-1">
          <p>
            {sido} {sigungu} 약국 | 야간약국 | 일요일약국 | 공휴일약국 | 주말약국 | 심야약국
          </p>
          <p>
            약국찾자에서 {sigungu}의 전체 약국 {pharmacies.length}곳의 영업시간과 전화번호를 확인하세요.
            일요일 영업 약국 {sundayCount}곳, 야간 운영 약국 {nightCount}곳 포함.
          </p>
        </section>
      </main>
    </div>
  );
}
