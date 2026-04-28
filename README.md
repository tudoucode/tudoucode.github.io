# TudouCode 个人网站

这是一个零构建依赖的静态个人网站，包含首页、文章归档和 AI 作品集。直接把当前目录上传到静态托管服务即可部署。

## 页面结构

- `index.html`：首页，包含简介、精选作品、最新文章、专题和关于我。
- `posts.html`：全部文章归档页，支持正文搜索、分类筛选和专题筛选。
- `portfolio.html`：AI 作品集页，支持图片、视频筛选和预览。
- `assets/portfolio/`：作品图片、视频和封面素材目录。

## 修改网站内容

主要编辑 `site.config.js`：

- `siteName`：网站名称。
- `siteInitial`：左上角标记。
- `siteUrl`：网站正式访问地址，用于 canonical、分享链接和结构化数据。
- `defaultOgImage`：默认分享图，用于首页、归档页、作品页和没有封面的文章。
- `description`：网站简介，会用于搜索引擎和分享摘要。
- `hero`：首页首屏文案。
- `latest`：首页“最近更新”卡片。
- `about`：关于我。
- `links`：Email、GitHub、Bilibili 等链接。
- `portfolio`：手工整理的作品信息。
- `posts`：文章列表。
- `topics`：专题列表。

## 添加 AI 图片和视频

推荐流程：

1. 把图片、视频或封面放入 `assets/portfolio/`。
2. 双击 `一键同步作品集.bat`，脚本会扫描素材并生成 `portfolio.auto.js`。
3. 在 `site.config.js` 的 `portfolio` 数组里为重要作品补充标题、分类、说明和 alt 文本。

前端会优先使用 `site.config.js` 里的人工整理信息；`portfolio.auto.js` 只用于补充新加入但尚未手工整理的素材。

视频封面可使用以下命名方式，脚本会自动识别：

```text
demo-cover.jpg
demo-poster.jpg
demo_cover.jpg
demo_poster.jpg
```

## 新增文章

每篇文章使用独立目录，Markdown 和插图放在一起：

```text
articles/
  build-personal-site/
    article.md
    index.html
    images/
```

日常修改文章时，主要编辑 `article.md`。插图放入同目录的 `images/`，并在 Markdown 里这样引用：

```markdown
![图片说明](images/example.png)
```

修改 Markdown 后，双击：

```text
一键生成文章页面.bat
```

脚本会做两件事：

- 根据每篇文章的 `article.md` 重新生成同目录的 `index.html`。
- 自动把所有文章同步到 `site.config.js` 的 `posts` 列表。
- 自动生成 `search-index.js`，用于文章归档页的正文搜索。

也就是说，新增文章时不需要手动修改 `site.config.js`。只要 `article.md` 的开头包含这些信息即可：

```markdown
---
title: 文章标题
date: 2026-04-25
category: 技术
summary: 文章摘要。
mediaClass: media-code
cover: images/example-cover.png
---
```

`mediaClass` 控制文章卡片封面样式，可选值包括 `media-code`、`media-desk`、`media-notes`。不填时脚本会默认使用 `media-notes`。

`cover` 是可选字段，用于文章列表和文章详情页封面。文章详情页会自动生成目录、阅读时间和封面图。

## 资源建议

- 展示用图片建议压缩为 WebP 或 AVIF。
- 网格缩略图尽量控制在 300KB 到 800KB。
- 视频建议提供压缩后的网页预览版，大文件原片单独归档。
- GitHub 不接受超过 100MB 的单个文件，`.gitignore` 已忽略 `demo_1.mp4`。
- `一键同步作品集.bat` 会自动跳过超过 95MB 的素材，避免把无法部署的大文件写进 `portfolio.auto.js`。

### 处理超过 100MB 的视频

推荐保留本地高清原片，再生成一个小于 95MB 的网页预览版：

```powershell
powershell -ExecutionPolicy Bypass -File .\compress-video.ps1 -InputPath .\assets\portfolio\demo_1.mp4
```

脚本会默认输出：

```text
assets/portfolio/demo_1-web.mp4
```

如果压缩后仍超过 95MB，可以提高 `-Crf`：

```powershell
powershell -ExecutionPolicy Bypass -File .\compress-video.ps1 -InputPath .\assets\portfolio\demo_1.mp4 -Crf 32
```

`Crf` 数值越大，文件越小，画质越低。生成部署版后，把 `site.config.js` 中对应作品的 `src` 指向 `demo_1-web.mp4`。

如果希望保留完整高清视频，可以把原片上传到 GitHub Releases、Cloudflare R2、阿里云 OSS、腾讯云 COS 或 Bilibili，然后在 `src` 中填写外部视频地址。

当前作品网格会优先读取 `thumbnail` 字段，点击预览时再加载 `src` 原图。新增图片后，可以双击：

```text
一键生成缩略图.bat
```

脚本会生成最长边约 900px 的 JPEG 缩略图，并放到：

```text
assets/portfolio/thumbs/
```

然后在 `site.config.js` 的对应作品里添加：

```js
thumbnail: "assets/portfolio/thumbs/example.jpg"
```

## 部署

部署前建议双击：

```text
一键检查网站.bat
```

检查脚本会验证大文件、缺失的本地链接或图片、乱码残留，以及 JavaScript 配置语法。

把 `index.html`、`posts.html`、`portfolio.html`、`styles.css`、`script.js`、`site.config.js`、`portfolio.auto.js` 和 `assets/` 一起上传到静态网站根目录。
