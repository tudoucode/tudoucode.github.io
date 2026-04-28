# TudouCode 个人技术博客

这是一个基于 Astro + TypeScript + Markdown/MDX 的静态个人博客和 AI 作品集。

当前站点保留了原有 UI 风格和功能：首页、文章归档、文章详情、左侧目录、作品筛选、作品预览、深浅色主题、SEO、robots、sitemap 和 GitHub Pages 部署。

## 本地开发

```powershell
npm install
npm run dev
```

构建生产版本：

```powershell
npm run build
```

类型和 Astro 模板检查：

```powershell
npm run check
```

## 目录结构

```text
src/
  components/      Astro 组件
  data/            站点数据读取
  layouts/         页面布局
  pages/           路由页面
  scripts/         浏览器交互脚本
  styles/          全局样式
articles/          Markdown 文章和文章配图
assets/            作品图片、视频和缩略图
scripts/           构建前资源复制脚本
.github/workflows/ GitHub Pages 自动部署
```

## 内容维护

站点配置仍然优先读取 `site.config.js`，因此现有作品、专题、首页文案可以继续在这里维护。

文章继续放在 `articles/<slug>/article.md`：

```markdown
---
title: 文章标题
date: 2026-04-25
category: 技术
summary: 文章摘要
mediaClass: media-code
cover: images/example-cover.png
---

正文内容...
```

文章图片放在同目录的 `images/` 内，并在 Markdown 中这样引用：

```markdown
![图片说明](images/example.png)
```

Astro 构建时会自动生成文章详情页、文章目录、阅读时间、SEO 信息、robots 和 sitemap。

## 部署

推送到 `main` 后，`.github/workflows/deploy.yml` 会自动构建 `dist/` 并部署到 GitHub Pages。

如果 GitHub Pages 仍在使用“Deploy from branch”，需要在仓库 Settings -> Pages 中把 Source 改为 `GitHub Actions`。

## 发布前检查

推荐流程：

```powershell
npm run check
npm run build
git status
git add .
git commit -m "Update site"
git push origin main
```

超过 100MB 的视频不要直接提交到 GitHub。当前 `.gitignore` 已排除 `assets/portfolio/demo_1.mp4`，部署用视频建议压缩到 95MB 以下，或放到外部对象存储/视频平台。
