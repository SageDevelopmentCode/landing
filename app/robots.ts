import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/agreement/"], // Don't index API routes or private agreement links
    },
    sitemap: "https://sagefield.co/sitemap.xml",
  };
}
