$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Get-Command python -ErrorAction SilentlyContinue

if (-not $python) {
  throw "Python is required to generate article HTML files."
}

$script = @'
from pathlib import Path
import html
import json
import re
from urllib.parse import urljoin

root = Path.cwd()
articles_root = root / "articles"

LABEL_ARTICLE = "\u6587\u7ae0"
LABEL_HOME = "\u56de\u5230\u9996\u9875"
LABEL_NAV = "\u4e3b\u5bfc\u822a"
LABEL_POSTS = "\u6587\u7ae0"
LABEL_PORTFOLIO = "\u4f5c\u54c1"
LABEL_TOPICS = "\u4e13\u9898"
LABEL_ABOUT = "\u5173\u4e8e"
LABEL_TOGGLE_THEME = "\u5207\u6362\u989c\u8272\u4e3b\u9898"
LABEL_BACK_TO_POSTS = "\u8fd4\u56de\u6587\u7ae0"
LABEL_MARKDOWN_SOURCE = "\u67e5\u770b Markdown \u6e90\u6587"
LABEL_READING_TIME = "\u5206\u949f\u9605\u8bfb"
LABEL_TOC = "\u76ee\u5f55"
LABEL_COPY_CODE = "\u590d\u5236"

def read_site_config_value(config, key, fallback=""):
    match = re.search(rf"\b{re.escape(key)}\s*:\s*(['\"])(.*?)\1", config)
    return match.group(2) if match else fallback

config_text = (root / "site.config.js").read_text(encoding="utf-8")
SITE_NAME = read_site_config_value(config_text, "siteName", "TudouCode")
SITE_URL = read_site_config_value(config_text, "siteUrl", "").rstrip("/")
DEFAULT_OG_IMAGE = read_site_config_value(config_text, "defaultOgImage", "")

def absolute_url(path):
    if path is None:
        return ""
    if path == "":
        return SITE_URL + "/" if SITE_URL else ""
    if re.match(r"^https?://", path):
        return path
    if not SITE_URL:
        return path
    return urljoin(SITE_URL + "/", path.lstrip("/"))

def parse_frontmatter(text):
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---\n", 4)
    if end == -1:
        return {}, text
    raw = text[4:end].strip().splitlines()
    meta = {}
    for line in raw:
        if ":" in line:
            key, value = line.split(":", 1)
            meta[key.strip()] = value.strip()
    return meta, text[end + 5:].lstrip()

def inline(text):
    escaped = html.escape(text)
    escaped = re.sub(r"`([^`]+)`", r"<code>\1</code>", escaped)
    escaped = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", lambda m: f'<a href="{html.escape(m.group(2), quote=True)}">{m.group(1)}</a>', escaped)
    return escaped

def slugify(text, used):
    base = re.sub(r"\s+", "-", text.strip().lower())
    base = re.sub(r"[^\w\u4e00-\u9fff-]+", "", base).strip("-")
    if not base:
        base = "section"
    slug = base
    count = 2
    while slug in used:
        slug = f"{base}-{count}"
        count += 1
    used.add(slug)
    return slug

def estimate_reading_minutes(markdown):
    text = re.sub(r"```[\s\S]*?```", " ", markdown)
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", " ", text)
    text = re.sub(r"\[[^\]]+\]\([^)]+\)", " ", text)
    cjk_chars = len(re.findall(r"[\u4e00-\u9fff]", text))
    words = len(re.findall(r"[A-Za-z0-9_]+", text))
    units = cjk_chars + words
    return max(1, round(units / 400))

def plain_text(markdown):
    text = re.sub(r"```[\s\S]*?```", " ", markdown)
    text = re.sub(r"!\[([^\]]*)\]\([^)]+\)", r" \1 ", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r" \1 ", text)
    text = re.sub(r"^---[\s\S]*?---", " ", text)
    text = re.sub(r"^#{1,6}\s*", " ", text, flags=re.MULTILINE)
    text = re.sub(r"[-*]\s+", " ", text)
    return re.sub(r"\s+", " ", text).strip()

def render_markdown(markdown, skip_image_src=""):
    lines = markdown.splitlines()
    output = []
    toc = []
    paragraph = []
    list_items = []
    in_code = False
    code_lines = []
    code_language = ""
    used_slugs = set()

    def flush_paragraph():
        nonlocal paragraph
        if paragraph:
            output.append(f"<p>{inline(' '.join(paragraph))}</p>")
            paragraph = []

    def flush_list():
        nonlocal list_items
        if list_items:
            items = "".join(f"<li>{inline(item)}</li>" for item in list_items)
            output.append(f"<ul>{items}</ul>")
            list_items = []

    for line in lines:
        if line.startswith("```"):
            if in_code:
                language_label = html.escape(code_language or "text")
                code_class = f' class="language-{html.escape(code_language, quote=True)}"' if code_language else ""
                output.append(
                    '<div class="article-code">'
                    f'<div class="code-toolbar"><span>{language_label}</span><button type="button" data-copy-code>{LABEL_COPY_CODE}</button></div>'
                    f'<pre><code{code_class}>' + html.escape("\n".join(code_lines)) + "</code></pre>"
                    "</div>"
                )
                code_lines = []
                in_code = False
                code_language = ""
            else:
                flush_paragraph()
                in_code = True
                code_language = line[3:].strip().split()[0].lower()
            continue

        if in_code:
            code_lines.append(line)
            continue

        if not line.strip():
            flush_paragraph()
            flush_list()
            continue

        image = re.match(r"!\[([^\]]*)\]\(([^)]+)\)", line.strip())
        if image:
            flush_paragraph()
            flush_list()
            if skip_image_src and image.group(2).lstrip("./") == skip_image_src.lstrip("./"):
                continue
            alt = html.escape(image.group(1), quote=True)
            src = html.escape(image.group(2), quote=True)
            caption = html.escape(image.group(1))
            output.append(f'<figure class="article-image"><img src="{src}" alt="{alt}"><figcaption>{caption}</figcaption></figure>')
            continue

        if line.startswith("# "):
            flush_paragraph()
            flush_list()
            continue

        if line.startswith("## "):
            flush_paragraph()
            flush_list()
            heading = line[3:].strip()
            slug = slugify(heading, used_slugs)
            toc.append({"title": heading, "id": slug})
            output.append(f'<h2 id="{html.escape(slug, quote=True)}">{inline(heading)}</h2>')
            continue

        if line.startswith("- "):
            flush_paragraph()
            list_items.append(line[2:].strip())
            continue

        paragraph.append(line.strip())

    flush_paragraph()
    flush_list()
    return "\n".join("          " + item for item in output), toc

def build_page(article_dir, meta, markdown):
    title = meta.get("title", article_dir.name)
    date = meta.get("date", "")
    category = meta.get("category", LABEL_ARTICLE)
    summary = meta.get("summary", "")
    display_date = date.replace("-", ".")
    cover = meta.get("cover", "")
    article_path = f"articles/{article_dir.name}/index.html"
    canonical_url = absolute_url(article_path)
    og_image_path = normalize_cover(article_dir, cover) if cover else DEFAULT_OG_IMAGE
    og_image_url = absolute_url(og_image_path)
    cover_src = html.escape(cover, quote=True)
    cover_alt = html.escape(title, quote=True)
    reading_minutes = estimate_reading_minutes(markdown)
    body, toc = render_markdown(markdown, cover)
    cover_meta = f'    <meta property="og:image" content="{html.escape(og_image_url, quote=True)}">\n' if og_image_url else ""
    cover_html = f'''
            <figure class="article-cover">
              <img src="{cover_src}" alt="{cover_alt}">
            </figure>''' if cover else ""
    json_ld = json.dumps({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": title,
        "description": summary,
        "datePublished": date,
        "author": {
            "@type": "Person",
            "name": SITE_NAME,
        },
        "publisher": {
            "@type": "Organization",
            "name": SITE_NAME,
        },
        "mainEntityOfPage": canonical_url,
        "image": og_image_url,
    }, ensure_ascii=False, separators=(",", ":"))
    toc_html = ""
    if toc:
        toc_items = "\n".join(
            f'              <a href="#{html.escape(item["id"], quote=True)}">{html.escape(item["title"])}</a>'
            for item in toc
        )
        toc_html = f'''
          <nav class="article-toc" aria-label="{LABEL_TOC}">
            <strong>{LABEL_TOC}</strong>
{toc_items}
          </nav>'''
    return f'''<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="{html.escape(summary, quote=True)}">
    <meta name="theme-color" content="#336b63">
    <link rel="canonical" href="{html.escape(canonical_url, quote=True)}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="{html.escape(SITE_NAME, quote=True)}">
    <meta property="og:title" content="{html.escape(title, quote=True)} - {html.escape(SITE_NAME, quote=True)}">
    <meta property="og:description" content="{html.escape(summary, quote=True)}">
    <meta property="og:url" content="{html.escape(canonical_url, quote=True)}">
{cover_meta}    <meta property="article:published_time" content="{html.escape(date, quote=True)}">
    <script type="application/ld+json">{json_ld}</script>
    <title>{html.escape(title)} - {html.escape(SITE_NAME)}</title>
    <link rel="stylesheet" href="../../styles.css">
  </head>
  <body data-page="article">
    <header class="site-header">
      <a class="brand" href="../../index.html" aria-label="{LABEL_HOME}">
        <span class="brand-mark" data-site-initial>TC</span>
        <span class="brand-text" data-site-name>TudouCode</span>
      </a>
      <nav class="site-nav" aria-label="{LABEL_NAV}">
        <a href="../../posts.html" aria-current="page">{LABEL_POSTS}</a>
        <a href="../../portfolio.html">{LABEL_PORTFOLIO}</a>
        <a href="../../index.html#topics">{LABEL_TOPICS}</a>
        <a href="../../index.html#about">{LABEL_ABOUT}</a>
      </nav>
      <button class="theme-toggle" type="button" aria-label="{LABEL_TOGGLE_THEME}" title="{LABEL_TOGGLE_THEME}">
        <span class="sun-icon" aria-hidden="true"></span>
      </button>
    </header>

    <main>
      <div class="article-shell{' article-shell-no-toc' if not toc_html else ''}">
{toc_html}
        <article class="article">
          <header class="article-header">
            <a class="article-back" href="../../posts.html">{LABEL_BACK_TO_POSTS}</a>
            <p class="eyebrow">{html.escape(category)} / {html.escape(display_date)} / {reading_minutes} {LABEL_READING_TIME}</p>
            <h1>{html.escape(title)}</h1>
            <p>{html.escape(summary)}</p>
            <a class="article-source" href="article.md">{LABEL_MARKDOWN_SOURCE}</a>
{cover_html}
          </header>

          <div class="article-body">
{body}
          </div>
        </article>
      </div>
    </main>

    <footer class="site-footer">
      <p>&copy; <span id="year"></span> <span data-footer-name>TudouCode</span>. Static personal site.</p>
      <a href="../../posts.html">{LABEL_BACK_TO_POSTS}</a>
    </footer>

    <script src="../../site.config.js"></script>
    <script src="../../portfolio.auto.js"></script>
    <script src="../../script.js"></script>
  </body>
</html>
'''

def normalize_cover(article_dir, cover):
    if not cover:
        return ""
    if re.match(r"^https?://", cover) or cover.startswith("/"):
        return cover
    return f"articles/{article_dir.name}/{cover.lstrip('./')}"

def sync_posts_config(posts):
    config_path = root / "site.config.js"
    config = config_path.read_text(encoding="utf-8")
    ordered = sorted(posts, key=lambda item: item.get("date", ""), reverse=True)

    lines = ["  posts: ["]
    for index, post in enumerate(ordered):
        comma = "," if index < len(ordered) - 1 else ""
        lines.extend([
            "    {",
            f"      title: {json.dumps(post['title'], ensure_ascii=False)},",
            f"      category: {json.dumps(post['category'], ensure_ascii=False)},",
            f"      date: {json.dumps(post['date'], ensure_ascii=False)},",
            f"      summary: {json.dumps(post['summary'], ensure_ascii=False)},",
            f"      url: {json.dumps(post['url'], ensure_ascii=False)},",
            f"      mediaClass: {json.dumps(post['mediaClass'], ensure_ascii=False)}" + ("," if post.get("cover") else ""),
        ])
        if post.get("cover"):
            lines.append(f"      cover: {json.dumps(post['cover'], ensure_ascii=False)}")
        lines.append(f"    }}{comma}")
    lines.append("  ]")
    replacement = "\n".join(lines)

    next_config, replaced = re.subn(
        r"  posts: \[[\s\S]*?\]\s*,\n\n  topics:",
        replacement + ",\n\n  topics:",
        config,
        count=1,
    )
    if replaced != 1:
        raise RuntimeError("Could not find posts array in site.config.js")
    config_path.write_text(next_config, encoding="utf-8")

def write_search_index(posts):
    index_path = root / "search-index.js"
    items = [
        {
            "title": post["title"],
            "category": post["category"],
            "date": post["date"],
            "summary": post["summary"],
            "url": post["url"],
            "content": post.get("content", ""),
        }
        for post in sorted(posts, key=lambda item: item.get("date", ""), reverse=True)
    ]
    index_path.write_text(
        "window.searchIndex = " + json.dumps(items, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )

def write_sitemap(posts):
    sitemap_path = root / "sitemap.xml"
    static_pages = [
        {"url": "", "priority": "1.0"},
        {"url": "posts.html", "priority": "0.8"},
        {"url": "portfolio.html", "priority": "0.8"},
    ]
    article_pages = [
        {"url": post["url"], "lastmod": post.get("date", ""), "priority": "0.7"}
        for post in sorted(posts, key=lambda item: item.get("date", ""), reverse=True)
    ]
    pages = static_pages + article_pages
    entries = []
    for page in pages:
        loc = absolute_url(page["url"])
        if not loc:
            continue
        parts = [
            "  <url>",
            f"    <loc>{html.escape(loc)}</loc>",
        ]
        if page.get("lastmod"):
            parts.append(f"    <lastmod>{html.escape(page['lastmod'])}</lastmod>")
        parts.extend([
            "    <changefreq>weekly</changefreq>",
            f"    <priority>{page.get('priority', '0.5')}</priority>",
            "  </url>",
        ])
        entries.append("\n".join(parts))
    content = "\n".join([
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        *entries,
        '</urlset>',
        '',
    ])
    sitemap_path.write_text(content, encoding="utf-8")

def write_robots():
    robots_path = root / "robots.txt"
    sitemap_url = absolute_url("sitemap.xml")
    lines = [
        "User-agent: *",
        "Allow: /",
    ]
    if sitemap_url:
        lines.append(f"Sitemap: {sitemap_url}")
    robots_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

count = 0
posts = []
for article_dir in sorted(path for path in articles_root.iterdir() if path.is_dir()):
    source = article_dir / "article.md"
    if not source.exists():
        continue
    meta, markdown = parse_frontmatter(source.read_text(encoding="utf-8"))
    (article_dir / "index.html").write_text(build_page(article_dir, meta, markdown), encoding="utf-8")
    posts.append({
        "title": meta.get("title", article_dir.name),
        "category": meta.get("category", LABEL_ARTICLE),
        "date": meta.get("date", ""),
        "summary": meta.get("summary", ""),
        "url": f"articles/{article_dir.name}/index.html",
        "mediaClass": meta.get("mediaClass", "media-notes"),
        "cover": normalize_cover(article_dir, meta.get("cover", "")),
        "content": plain_text(markdown),
    })
    count += 1

sync_posts_config(posts)
write_search_index(posts)
write_sitemap(posts)
write_robots()
print(f"Generated {count} article page(s).")
print(f"Synced {len(posts)} post item(s) to site.config.js.")
print("Synced search-index.js.")
print("Synced sitemap.xml and robots.txt.")
'@

Push-Location $root
try {
  $script | python -
} finally {
  Pop-Location
}
