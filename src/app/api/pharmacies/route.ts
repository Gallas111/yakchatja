import { NextRequest, NextResponse } from 'next/server';
import { fetchPharmacies } from '@/lib/pharmacy-api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const Q0 = searchParams.get('Q0') || undefined;
  const Q1 = searchParams.get('Q1') || undefined;
  const QN = searchParams.get('QN') || undefined;
  const pageNo = parseInt(searchParams.get('pageNo') || '1');
  const numOfRows = parseInt(searchParams.get('numOfRows') || '100');

  try {
    const pharmacies = await fetchPharmacies({ Q0, Q1, QN, pageNo, numOfRows });
    return NextResponse.json({ pharmacies, count: pharmacies.length });
  } catch (err) {
    console.error('약국 API 에러:', err);
    return NextResponse.json(
      { error: '약국 정보를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
