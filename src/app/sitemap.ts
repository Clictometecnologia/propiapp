import { MetadataRoute } from 'next';
import { db } from '@/services/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://propiapp.cl';

  // Fetch all published properties
  const properties = await db.getProperties({ onlyPublished: true });

  const propertyUrls = properties.map((prop) => ({
    url: `${baseUrl}/propiedades/${prop.slug}`,
    lastModified: new Date(prop.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...propertyUrls,
  ];
}
