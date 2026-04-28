import { cp, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const publicDir = path.join(root, "public");

async function copyIfExists(from, to) {
  if (!existsSync(from)) return;
  await mkdir(path.dirname(to), { recursive: true });
  await cp(from, to, { recursive: true, force: true });
}

await mkdir(publicDir, { recursive: true });
await copyIfExists(path.join(root, "assets"), path.join(publicDir, "assets"));
await copyIfExists(path.join(root, ".nojekyll"), path.join(publicDir, ".nojekyll"));

const articlesDir = path.join(root, "articles");
if (existsSync(articlesDir)) {
  const entries = await readdir(articlesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    await copyIfExists(
      path.join(articlesDir, entry.name, "article.md"),
      path.join(publicDir, "articles", entry.name, "article.md")
    );
    await copyIfExists(
      path.join(articlesDir, entry.name, "images"),
      path.join(publicDir, "articles", entry.name, "images")
    );
  }
}
