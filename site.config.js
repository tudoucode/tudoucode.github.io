window.siteConfig = {
  siteName: "TudouCode",
  siteInitial: "TC",
  description: "一个记录技术、生活、AI 创作与长期思考的个人网站。",
  homePortfolioLimit: 6,

  hero: {
    kicker: "Personal Blog & AI Portfolio",
    title: "把日常观察、技术实践和 AI 创作写下来。",
    description: "这里是我的个人网站，用来展示博客文章、AI 图片、视频和创作实验。"
  },

  latest: {
    title: "个人网站准备上线",
    summary: "静态页面已经搭好，接下来可以继续补充作品、文章、域名和部署。"
  },

  intro: {
    title: "把内容和作品放在一个长期可维护的地方。",
    description: "这里会沉淀我的技术笔记、项目复盘、读书摘录，也会展示 AI 生成图片、视频、短片和创作过程。"
  },

  about: {
    initial: "你",
    title: "你好，我是这个网站的作者。",
    description: "把这段文字改成你的个人简介。例如：我关注 Web 开发、AI 创作和个人知识管理，正在用这个网站记录长期学习和作品实验。"
  },

  links: [
    { label: "Email", url: "tudoucode@163.com" },
    { label: "GitHub", url: "https://github.com/tudoucode" },
    { label: "Bilibili", url: "#" }
  ],

  portfolio: [
    {
      title: "赛博城市概念图",
      type: "image",
      category: "AI Image",
      year: "2026",
      src: "",
      alt: "赛博城市概念图",
      description: "用 AI 生成的城市视觉实验。把真实作品图片放进 assets/portfolio 后，在 src 中填写路径。"
    },
    {
      title: "角色短片测试",
      type: "video",
      category: "AI Video",
      year: "2026",
      src: "",
      poster: "",
      description: "用于展示 AI 视频、动效或短片。支持 mp4、webm 等浏览器可播放格式。"
    },
    {
      title: "产品视觉海报",
      type: "image",
      category: "Poster",
      year: "2026",
      src: "",
      alt: "产品视觉海报",
      description: "适合展示海报、封面、产品图、风格探索和商业视觉。"
    },
    {
      title: "动态分镜实验",
      type: "video",
      category: "Storyboard",
      year: "2026",
      src: "",
      poster: "",
      description: "适合展示分镜动画、生成式视频和剪辑片段。"
    }
  ],

  posts: [
    {
      title: "从一个空文件夹开始搭建个人网站",
      category: "技术",
      date: "2026-04-16",
      summary: "记录部署目录、静态资源、页面结构和后续扩展路线，给未来维护留一份清晰入口。",
      url: "#",
      mediaClass: "media-code"
    },
    {
      title: "项目复盘应该记录什么",
      category: "复盘",
      date: "2026-04-08",
      summary: "比起流水账，更有价值的是决策背景、约束条件、踩坑过程和下一次如何做得更好。",
      url: "#",
      mediaClass: "media-desk"
    },
    {
      title: "把读书笔记变成可搜索的知识库",
      category: "阅读",
      date: "2026-03-29",
      summary: "用标签、摘要和引用来源，让碎片化阅读逐渐沉淀成可以复用的个人资料库。",
      url: "#",
      mediaClass: "media-notes"
    }
  ],

  topics: [
    { title: "Web 开发", description: "前端、部署、性能、工程化" },
    { title: "AI 创作", description: "图片、视频、工作流、提示词" },
    { title: "长期思考", description: "学习、写作、复盘、选择" }
  ]
};
