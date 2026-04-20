import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/favicon.ico", "/manifest.json", "/images/"],
        disallow: ["/api"],
      },
    ],
    sitemap: "https://avomenu.com/sitemap.xml",
  };
}
