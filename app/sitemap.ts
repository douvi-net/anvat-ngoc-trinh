import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://anvatngoctrinh.vn";

  return [
    {
      url: baseUrl,
      lastModified: new Date("2026-06-14"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/dat-mon-nhanh`,
      lastModified: new Date("2026-06-14"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tra-cuu-don`,
      lastModified: new Date("2026-06-14"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/bai-viet`,
      lastModified: new Date("2026-06-14"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/gioi-thieu`,
      lastModified: new Date("2026-06-14"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/lien-he`,
      lastModified: new Date("2026-06-14"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}