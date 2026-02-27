import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://yakchatja.com'),
  title: {
    default: '약찾자 - 내 주변 영업중인 약국 찾기',
    template: '%s | 약찾자',
  },
  description:
    '주말, 야간, 공휴일에도 영업중인 약국을 실시간으로 찾아보세요. GPS 기반 내 주변 약국 검색, 영업시간 확인, 전화걸기, 길찾기까지 한번에.',
  keywords: [
    '약국 찾기',
    '내 주변 약국',
    '야간약국',
    '일요일 약국',
    '공휴일 약국',
    '주말 약국',
    '심야약국',
    '약국 영업시간',
    '24시 약국',
    '약국 검색',
    '약찾자',
  ],
  openGraph: {
    title: '약찾자 - 내 주변 영업중인 약국 찾기',
    description: '주말, 야간, 공휴일에도 영업중인 약국을 실시간으로 찾아보세요.',
    url: 'https://yakchatja.com',
    siteName: '약찾자',
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: '약찾자 - 내 주변 영업중인 약국 찾기',
    description: '주말, 야간, 공휴일에도 영업중인 약국을 실시간으로 찾아보세요.',
  },
  alternates: {
    canonical: 'https://yakchatja.com',
  },
  verification: {
    google: 'mA_EviIDJwhSLzqYsZqqlAL-N36joA8VkaA-cHBM-sA',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-581YMPLLPM"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-581YMPLLPM');
          `}
        </Script>
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
