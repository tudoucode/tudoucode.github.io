# 个人网站静态站点

这是一个零构建依赖的静态个人网站，包含博客首页和 AI 作品集页面。直接上传当前文件夹即可部署。

## 页面

- `index.html`：首页，包含简介、作品精选、文章列表、专题和关于我。
- `posts.html`：独立全部文章页面。
- `portfolio.html`：独立 AI 作品集页面。
- `assets/portfolio/`：只存放图片、视频和封面素材，不是页面。

## 如何修改网站信息

主要修改 `site.config.js`：

- `siteName`：网站名称，例如 `"张三的博客"`。
- `siteInitial`：左上角标记里的字母或汉字，例如 `"张"`。
- `description`：网站简介，会用于搜索引擎描述。
- `hero.title`：首页大标题。
- `hero.description`：首页大标题下面的说明。
- `homePortfolioLimit`：备用的首页数量限制；当前首页优先渲染全部作品并通过固定高度截断，避免流式展示留空。
- `about.title`：关于我标题。
- `about.description`：个人简介。
- `links`：邮箱、GitHub、Bilibili 等链接。
- `portfolio`：AI 作品集，支持图片和视频。
- `posts`：首页文章列表。
- `topics`：专题列表。

## 如何展示 AI 图片和视频

最快方式：

1. 把图片或视频放进 `assets/portfolio/`。
2. 双击 `一键同步作品集.bat`。
3. 打开 `portfolio.html` 查看效果。

脚本会自动扫描 `assets/portfolio/`，生成 `portfolio.auto.js`。只要 `portfolio.auto.js` 里有作品，页面会优先显示自动生成的作品列表。

把素材放到 `assets/portfolio/` 目录，例如：

```text
assets/portfolio/city.jpg
assets/portfolio/demo.mp4
assets/portfolio/demo-cover.jpg
```

视频封面可以按下面任意一种方式命名，脚本会自动识别：

```text
demo-cover.jpg
demo-poster.jpg
demo_cover.jpg
demo_poster.jpg
```

手动方式：

然后在 `site.config.js` 的 `portfolio` 数组里填写：

```js
{
  title: "作品标题",
  type: "image",
  category: "AI Image",
  year: "2026",
  src: "assets/portfolio/city.jpg",
  alt: "作品描述",
  description: "这件作品的说明。"
}
```

视频写法：

```js
{
  title: "视频标题",
  type: "video",
  category: "AI Video",
  year: "2026",
  src: "assets/portfolio/demo.mp4",
  poster: "assets/portfolio/demo-cover.jpg",
  description: "这段视频的说明。"
}
```

如果 `src` 暂时留空，页面会显示设计占位图。

## 如何新增文章

在 `site.config.js` 的 `posts` 数组里复制一段文章配置：

```js
{
  title: "文章标题",
  category: "技术",
  date: "2026-04-16",
  summary: "文章摘要。",
  url: "#",
  mediaClass: "media-code"
}
```

如果暂时没有独立文章页面，`url` 可以先保持 `"#"`。

## 部署

把 `index.html`、`posts.html`、`portfolio.html`、`styles.css`、`script.js`、`site.config.js`、`portfolio.auto.js` 和 `assets` 文件夹一起上传到静态网站根目录。
