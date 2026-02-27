export interface PharmacyRaw {
  dutyAddr: string;        // 주소
  dutyName: string;        // 약국명
  dutyTel1: string;        // 전화번호
  wgs84Lat: string;        // 위도
  wgs84Lon: string;        // 경도
  dutyTime1s?: string;     // 월 시작
  dutyTime1c?: string;     // 월 종료
  dutyTime2s?: string;
  dutyTime2c?: string;
  dutyTime3s?: string;
  dutyTime3c?: string;
  dutyTime4s?: string;
  dutyTime4c?: string;
  dutyTime5s?: string;
  dutyTime5c?: string;
  dutyTime6s?: string;     // 토
  dutyTime6c?: string;
  dutyTime7s?: string;     // 일
  dutyTime7c?: string;
  dutyTime8s?: string;     // 공휴일
  dutyTime8c?: string;
  [key: string]: string | undefined;
}

const BASE_URL = 'https://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyListInfoInqire';

interface FetchParams {
  Q0?: string;    // 시도
  Q1?: string;    // 시군구
  QN?: string;    // 약국명
  pageNo?: number;
  numOfRows?: number;
}

export async function fetchPharmacies(params: FetchParams): Promise<PharmacyRaw[]> {
  const apiKey = process.env.DATA_API_KEY;
  if (!apiKey) throw new Error('DATA_API_KEY 환경변수가 설정되지 않았습니다.');

  const url = new URL(BASE_URL);
  url.searchParams.set('serviceKey', apiKey);
  url.searchParams.set('pageNo', String(params.pageNo || 1));
  url.searchParams.set('numOfRows', String(params.numOfRows || 100));
  url.searchParams.set('_type', 'json');

  if (params.Q0) url.searchParams.set('Q0', params.Q0);
  if (params.Q1) url.searchParams.set('Q1', params.Q1);
  if (params.QN) url.searchParams.set('QN', params.QN);

  const res = await fetch(url.toString(), {
    next: { revalidate: 300 }, // 5분 캐시
  });

  if (!res.ok) {
    throw new Error(`API 호출 실패: ${res.status}`);
  }

  const data = await res.json();

  const body = data?.response?.body;
  if (!body || !body.items) return [];

  const items = body.items.item;
  if (!items) return [];

  // 단일 결과일 때 배열이 아닌 객체로 오는 경우 처리
  return Array.isArray(items) ? items : [items];
}
