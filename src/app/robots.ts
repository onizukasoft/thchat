import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/board", "/login", "/register", "/vip", "/superstar", "/announcements", "/install"],
        disallow: ["/api/", "/chat/", "/profile/", "/admin/", "/coins/", "/gifts/", "/favorites/", "/notifications/"],
      },
    ],
    sitemap: "https://thchat.net/sitemap.xml",
    host: "https://thchat.net",
  };
}
