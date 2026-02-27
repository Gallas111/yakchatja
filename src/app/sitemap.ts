import { MetadataRoute } from 'next';
import { SIGUNGU_MAP } from '@/lib/regions';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.yakchatja.com';

  const regionUrls: MetadataRoute.Sitemap = Object.entries(SIGUNGU_MAP).flatMap(
    ([sido, sigunguList]) =>
      sigunguList.map((sigungu) => ({
        url: `${baseUrl}/${encodeURIComponent(sido)}/${encodeURIComponent(sigungu)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
  );

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...regionUrls,
  ];
}
