import { ImageResponse } from 'next/og';

export const alt = '약국찾자 - 내 주변 영업중인 약국 찾기';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7, #bbf7d0)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #16a34a, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
            }}
          >
            💊
          </div>
          <span
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: '#16a34a',
            }}
          >
            약국찾자
          </span>
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#374151',
            fontWeight: 600,
          }}
        >
          내 주변 영업중인 약국을 실시간으로 찾아보세요
        </div>
        <div
          style={{
            fontSize: 22,
            color: '#6b7280',
            marginTop: 16,
            display: 'flex',
            gap: 16,
          }}
        >
          <span>야간약국</span>
          <span>|</span>
          <span>일요일약국</span>
          <span>|</span>
          <span>공휴일약국</span>
          <span>|</span>
          <span>심야약국</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
