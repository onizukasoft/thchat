import { MetadataRoute } from "next";

const BASE = "https://thchat.net";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { url: BASE,                    priority: 1.0, changeFrequency: "always" as const },
    { url: `${BASE}/login`,         priority: 0.9, changeFrequency: "yearly" as const },
    { url: `${BASE}/register`,      priority: 0.9, changeFrequency: "yearly" as const },
    { url: `${BASE}/board`,         priority: 0.8, changeFrequency: "always" as const },
    { url: `${BASE}/chat`,          priority: 0.8, changeFrequency: "always" as const },
    { url: `${BASE}/room`,          priority: 0.7, changeFrequency: "daily" as const },
    { url: `${BASE}/gifts`,         priority: 0.6, changeFrequency: "weekly" as const },
    { url: `${BASE}/coins`,         priority: 0.7, changeFrequency: "weekly" as const },
    { url: `${BASE}/vip`,           priority: 0.7, changeFrequency: "weekly" as const },
    { url: `${BASE}/favorites`,     priority: 0.6, changeFrequency: "daily" as const },
    { url: `${BASE}/superstar`,     priority: 0.6, changeFrequency: "daily" as const },
    { url: `${BASE}/announcements`, priority: 0.5, changeFrequency: "weekly" as const },
    { url: `${BASE}/install`,       priority: 0.5, changeFrequency: "yearly" as const },
  ];

  return staticRoutes.map((r) => ({
    url: r.url,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
