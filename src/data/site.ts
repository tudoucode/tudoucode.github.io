import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

export type PortfolioItem = {
  title: string;
  type: "image" | "video";
  category?: string;
  year?: string;
  src?: string;
  thumbnail?: string;
  poster?: string;
  alt?: string;
  description?: string;
};

export type PostItem = {
  title: string;
  category: string;
  date: string;
  summary: string;
  url: string;
  mediaClass?: string;
  cover?: string;
};

export type TopicItem = {
  key: string;
  title: string;
  description: string;
  url: string;
  categories: string[];
};

export type SiteConfig = {
  siteName: string;
  siteInitial: string;
  siteUrl: string;
  defaultOgImage: string;
  description: string;
  homePortfolioLimit: number;
  pages: Record<string, { title: string; description: string }>;
  hero: { kicker: string; title: string; description: string };
  latest: { title: string; summary: string };
  intro: { title: string; description: string };
  about: { initial: string; title: string; description: string };
  links: { label: string; url: string }[];
  portfolio: PortfolioItem[];
  posts: PostItem[];
  topics: TopicItem[];
};

function loadBrowserGlobal<T>(fileName: string, globalName: string, fallback: T): T {
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return fallback;

  const code = fs.readFileSync(filePath, "utf-8");
  const sandbox = { window: {} as Record<string, unknown> };
  vm.runInNewContext(code, sandbox, { filename: filePath });
  return (sandbox.window[globalName] as T) || fallback;
}

export const siteConfig = loadBrowserGlobal<SiteConfig>("site.config.js", "siteConfig", {} as SiteConfig);
const autoPortfolio = loadBrowserGlobal<PortfolioItem[]>("portfolio.auto.js", "autoPortfolio", []);

const manualBySrc = new Map(siteConfig.portfolio.filter((item) => item.src).map((item) => [item.src, item]));

export const portfolioItems = [
  ...siteConfig.portfolio,
  ...autoPortfolio.filter((item) => item.src && !manualBySrc.has(item.src))
];

export const getAbsoluteUrl = (pathName = "") => {
  const siteUrl = siteConfig.siteUrl.replace(/\/$/, "");
  if (!pathName) return `${siteUrl}/`;
  if (/^https?:\/\//.test(pathName)) return pathName;
  return `${siteUrl}/${pathName.replace(/^\//, "")}`;
};

export const getAssetUrl = (pathName?: string) => {
  if (!pathName) return undefined;
  return pathName.startsWith("/") ? pathName : `/${pathName}`;
};

export const getArticleSlugFromUrl = (url: string) => {
  const match = url.match(/articles\/([^/]+)\//);
  return match?.[1] || "";
};
