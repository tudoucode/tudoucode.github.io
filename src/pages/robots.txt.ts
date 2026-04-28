import { siteConfig } from "@/data/site";

export function GET() {
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${siteConfig.siteUrl}/sitemap-index.xml\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}
