import { getArticleSlugFromUrl, siteConfig, type PostItem } from "@/data/site";
import type { MarkdownInstance } from "astro";
import fs from "node:fs";
import path from "node:path";

type Heading = { depth: number; slug: string; text: string };
type MarkdownModule = MarkdownInstance<Record<string, unknown>> & { headings?: Heading[] };

const modules = import.meta.glob("../../articles/*/article.md", { eager: true }) as Record<string, MarkdownModule>;

const normalizeDate = (value: unknown) => {
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return (value as Date).toISOString().slice(0, 10);
  }
  const text = String(value || "");
  return text.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || text;
};

const slugify = (text: string) => {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fff-]+/g, "")
    .replace(/^-+|-+$/g, "") || "section";
};

const extractHeadings = (markdown: string) => {
  return markdown
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(/^(#{2,3})\s+(.+)$/);
      if (!match) return null;
      const text = match[2].replace(/[#`*_]/g, "").trim();
      return {
        depth: match[1].length,
        slug: slugify(text),
        text
      };
    })
    .filter(Boolean) as { depth: number; slug: string; text: string }[];
};

export const articleModules = Object.entries(modules).map(([filePath, module]) => {
  const slug = filePath.match(/articles\/([^/]+)\/article\.md$/)?.[1] || "";
  const rawPath = path.join(process.cwd(), "articles", slug, "article.md");
  const rawContent = fs.existsSync(rawPath) ? fs.readFileSync(rawPath, "utf-8") : "";
  const post = siteConfig.posts.find((item) => getArticleSlugFromUrl(item.url) === slug);
  const frontmatter = module.frontmatter || {};

  return {
    slug,
    module,
    title: String(frontmatter.title || post?.title || slug),
    date: normalizeDate(frontmatter.date || post?.date),
    category: String(frontmatter.category || post?.category || ""),
    summary: String(frontmatter.summary || post?.summary || ""),
    mediaClass: String(frontmatter.mediaClass || post?.mediaClass || "media-code"),
    cover: frontmatter.cover ? `/articles/${slug}/${String(frontmatter.cover)}` : post?.cover ? `/${post.cover}` : undefined,
    url: `/articles/${slug}/`,
    sourceUrl: `/articles/${slug}/article.md`,
    content: rawContent,
    headings: module.headings?.length ? module.headings : extractHeadings(rawContent)
  };
}).sort((a, b) => b.date.localeCompare(a.date));

export type ArticleItem = (typeof articleModules)[number];

export const posts = articleModules.map((article) => ({
  title: article.title,
  category: article.category,
  date: article.date,
  summary: article.summary,
  url: article.url,
  mediaClass: article.mediaClass,
  cover: article.cover,
  searchContent: article.content
})) as (PostItem & { searchContent: string })[];

export const getTopicPosts = (topicKey?: string) => {
  const topic = siteConfig.topics.find((item) => item.key === topicKey);
  if (!topic?.categories?.length) return posts;
  return posts.filter((post) => topic.categories.includes(post.category));
};

export const getReadingTime = (content: string) => {
  const plainText = content.replace(/<[^>]+>/g, "");
  const cjkCount = (plainText.match(/[\u4e00-\u9fff]/g) || []).length;
  const latinWords = (plainText.replace(/[\u4e00-\u9fff]/g, " ").match(/\b\w+\b/g) || []).length;
  return Math.max(1, Math.ceil((cjkCount + latinWords) / 350));
};
