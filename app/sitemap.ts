import { MetadataRoute } from 'next';
import { siteConfig } from '@/data/config/site.settings';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = siteConfig.siteUrl;

  return [
    { url: siteUrl, lastModified: new Date().toISOString().split('T')[0] },
    { url: `${siteUrl}/dashboard`, lastModified: new Date().toISOString().split('T')[0] },
  ];
}
