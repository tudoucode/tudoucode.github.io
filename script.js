const root = document.documentElement;
const themeButton = document.querySelector(".theme-toggle");
const savedTheme = localStorage.getItem("theme");
const config = window.siteConfig || {};
const manualPortfolio = Array.isArray(config.portfolio) ? config.portfolio : [];
const autoPortfolio = Array.isArray(window.autoPortfolio) ? window.autoPortfolio : [];
const manualBySrc = new Map(manualPortfolio.filter((item) => item.src).map((item) => [item.src, item]));
const portfolioItems = [
  ...manualPortfolio,
  ...autoPortfolio.filter((item) => item.src && !manualBySrc.has(item.src))
];
let activePortfolioFilter = "all";
let activePostCategory = "all";

const labels = {
  noPosts: "\u6ca1\u6709\u627e\u5230\u5339\u914d\u7684\u6587\u7ae0\u3002",
  read: "\u9605\u8bfb",
  article: "\u6587\u7ae0",
  articleCover: "\u6587\u7ae0\u5c01\u9762",
  all: "\u5168\u90e8",
  videoCover: "AI \u89c6\u9891\u5c01\u9762",
  aiWork: "AI \u4f5c\u54c1",
  preview: "\u9884\u89c8",
  clickPreview: "\u70b9\u51fb\u9884\u89c8",
  untitledWork: "\u672a\u547d\u540d\u4f5c\u54c1",
  pendingDescription: "\u540e\u7eed\u8865\u5145\u521b\u4f5c\u8bf4\u660e\u3002",
  unsupportedVideo: "\u5f53\u524d\u6d4f\u89c8\u5668\u4e0d\u652f\u6301\u89c6\u9891\u64ad\u653e\u3002",
  closePreview: "\u5173\u95ed\u9884\u89c8",
  closeSymbol: "\u00d7",
  copied: "\u5df2\u590d\u5236",
  copy: "\u590d\u5236",
  copyFailed: "\u590d\u5236\u5931\u8d25"
};

if (savedTheme) {
  root.dataset.theme = savedTheme;
}

themeButton?.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = nextTheme;
  localStorage.setItem("theme", nextTheme);
});

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const escapeAttr = escapeHtml;

const setText = (selector, value) => {
  const element = document.querySelector(selector);
  if (element && value) {
    element.textContent = value;
  }
};

const formatDate = (value) => {
  if (!value) return "";
  return value.replaceAll("-", ".");
};

const getActiveTopic = () => {
  const topicKey = new URLSearchParams(window.location.search).get("topic");
  if (!topicKey || !Array.isArray(config.topics)) return null;
  return config.topics.find((topic) => topic.key === topicKey || topic.url?.includes(`topic=${topicKey}`)) || null;
};

const getTopicPosts = () => {
  if (!Array.isArray(config.posts)) return [];
  const activeTopic = getActiveTopic();
  const allowedCategories = activeTopic?.categories || [];
  return allowedCategories.length
    ? config.posts.filter((post) => allowedCategories.includes(post.category))
    : config.posts;
};

const searchIndexByUrl = new Map(
  (Array.isArray(window.searchIndex) ? window.searchIndex : [])
    .filter((item) => item.url)
    .map((item) => [item.url, item])
);

const updateMeta = () => {
  const pageKey = document.body.dataset.page || "home";
  const page = config.pages?.[pageKey] || {};
  const activeTopic = pageKey === "posts" ? getActiveTopic() : null;
  const title = activeTopic ? `${activeTopic.title} - TudouCode` : page.title || config.siteName;
  const description = activeTopic?.description || page.description || config.description;

  if (title) {
    document.title = title;
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
  }

  if (description) {
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
  }
};

const renderPosts = () => {
  const container = document.querySelector("[data-posts]");
  if (!container || !Array.isArray(config.posts)) return;
  const limit = container.dataset.postLimit;
  const activeTopic = getActiveTopic();
  const query = document.querySelector("[data-post-search]")?.value.trim().toLowerCase() || "";
  const sourcePosts = getTopicPosts();
  const filteredPosts = sourcePosts.filter((post) => {
    const matchesCategory = activePostCategory === "all" || post.category === activePostCategory;
    const indexItem = searchIndexByUrl.get(post.url) || {};
    const searchable = [
      post.title,
      post.category,
      post.summary,
      post.date,
      indexItem.content
    ].filter(Boolean).join(" ").toLowerCase();
    const matchesQuery = !query || searchable.includes(query);
    return matchesCategory && matchesQuery;
  });
  const posts = limit === "all" ? filteredPosts : filteredPosts.slice(0, 3);

  if (activeTopic) {
    setText("[data-posts-title]", activeTopic.title);
    setText("[data-posts-description]", activeTopic.description);
  }

  if (!posts.length) {
    container.innerHTML = `<p class="empty-state">${labels.noPosts}</p>`;
    return;
  }

  container.innerHTML = posts.map((post, index) => `
    <article class="post-card ${index === 0 ? "featured" : ""}">
      ${post.cover
        ? `<a class="post-media post-cover" href="${escapeAttr(post.url || "#")}" aria-label="${labels.read} ${escapeAttr(post.title || labels.article)}"><img src="${escapeAttr(post.cover)}" alt="${escapeAttr(post.title || labels.articleCover)}" loading="lazy"></a>`
        : `<div class="post-media ${escapeAttr(post.mediaClass || "media-code")}" aria-hidden="true"></div>`}
      <div class="post-body">
        <div class="meta">
          <span>${escapeHtml(post.category || labels.article)}</span>
          <time datetime="${escapeAttr(post.date || "")}">${formatDate(post.date)}</time>
        </div>
        <h3><a href="${escapeAttr(post.url || "#")}">${escapeHtml(post.title || "")}</a></h3>
        <p>${escapeHtml(post.summary || "")}</p>
      </div>
    </article>
  `).join("");
};

const renderPostTools = () => {
  const categoryContainer = document.querySelector("[data-post-categories]");
  if (!categoryContainer) return;

  const categories = [...new Set(getTopicPosts().map((post) => post.category).filter(Boolean))];
  const buttons = [
    { label: labels.all, value: "all" },
    ...categories.map((category) => ({ label: category, value: category }))
  ];

  if (!categories.includes(activePostCategory)) {
    activePostCategory = "all";
  }

  categoryContainer.innerHTML = buttons.map((button) => `
    <button class="filter-button ${button.value === activePostCategory ? "active" : ""}" type="button" data-post-category="${escapeAttr(button.value)}">
      ${escapeHtml(button.label)}
    </button>
  `).join("");
};

const renderTopics = () => {
  const container = document.querySelector("[data-topics]");
  if (!container || !Array.isArray(config.topics)) return;

  container.innerHTML = config.topics.map((topic, index) => `
    <a href="${escapeAttr(topic.url || "#")}">
      <span>${String(index + 1).padStart(2, "0")}</span>
      <strong>${escapeHtml(topic.title || "")}</strong>
      <em>${escapeHtml(topic.description || "")}</em>
    </a>
  `).join("");
};

const renderLinks = () => {
  const container = document.querySelector("[data-links]");
  if (!container || !Array.isArray(config.links)) return;

  container.innerHTML = config.links.map((link) => {
    const rawUrl = link.url || "#";
    const isEmail = rawUrl.includes("@") && !rawUrl.startsWith("mailto:");
    const href = isEmail ? `mailto:${rawUrl}` : rawUrl;
    const isExternal = href.startsWith("http");
    const attrs = isExternal ? ' target="_blank" rel="noreferrer"' : "";
    const detail = rawUrl.replace(/^mailto:/, "");

    return `
      <a class="contact-link" href="${escapeAttr(href)}"${attrs} aria-label="${escapeAttr(link.label || "Link")}: ${escapeAttr(detail)}">
        <span class="contact-label">${escapeHtml(link.label || "Link")}</span>
        <span class="contact-detail">${escapeHtml(detail)}</span>
      </a>
    `;
  }).join("");
};

const renderPortfolioMedia = (item, index) => {
  const placeholder = `
    <div class="portfolio-placeholder placeholder-${(index % 4) + 1}" aria-hidden="true">
      <span>${item.type === "video" ? "VIDEO" : "IMAGE"}</span>
    </div>
  `;

  if (!item.src) {
    return placeholder;
  }

  if (item.type === "video") {
    if (!item.poster) {
      return placeholder;
    }

    return `
      <img class="portfolio-media" src="${escapeAttr(item.poster)}" alt="${escapeAttr(item.title || labels.videoCover)}" loading="lazy">
      <span class="video-badge" aria-hidden="true"></span>
    `;
  }

  return `<img class="portfolio-media" src="${escapeAttr(item.thumbnail || item.src)}" alt="${escapeAttr(item.alt || item.title || labels.aiWork)}" loading="lazy">`;
};

const getVisiblePortfolioItems = (container) => {
  const limit = container?.dataset.portfolioLimit;
  const homeLimit = Number(config.homePortfolioLimit || 6);
  const isHomeGrid = container?.classList.contains("portfolio-grid-home");
  const filteredItems = activePortfolioFilter === "all"
    ? portfolioItems
    : portfolioItems.filter((item) => item.type === activePortfolioFilter);

  if (limit === "all") return filteredItems;
  return isHomeGrid ? filteredItems.slice(0, homeLimit) : filteredItems.slice(0, homeLimit);
};

const renderPortfolio = () => {
  const container = document.querySelector("[data-portfolio]");
  if (!container || !Array.isArray(portfolioItems)) return;
  const items = getVisiblePortfolioItems(container);
  const isHomeGrid = container.classList.contains("portfolio-grid-home");

  container.innerHTML = items.map((item, index) => `
    <article class="portfolio-card ${isHomeGrid ? "portfolio-card-visual" : ""}">
      <button class="portfolio-frame" type="button" ${item.src ? "" : "disabled"} data-portfolio-index="${index}" aria-label="${labels.preview} ${escapeAttr(item.title || labels.aiWork)}">
        ${renderPortfolioMedia(item, index)}
        ${item.src && !isHomeGrid ? `<span class="portfolio-open">${labels.clickPreview}</span>` : ""}
      </button>
      ${isHomeGrid ? "" : `<div class="portfolio-body">
        <div class="portfolio-meta">
          <span>${escapeHtml(item.category || (item.type === "video" ? "AI Video" : "AI Image"))}</span>
          <span>${escapeHtml(item.year || "")}</span>
        </div>
        <h3>${escapeHtml(item.title || labels.untitledWork)}</h3>
        <p>${escapeHtml(item.description || labels.pendingDescription)}</p>
      </div>`}
    </article>
  `).join("");

  if (isHomeGrid) {
    container.style.height = "";
    container.classList.remove("is-clipped");
    return;
  }

  requestAnimationFrame(() => layoutPortfolioGrid(container));
  container.querySelectorAll("img").forEach((image) => {
    const applyAspectRatio = () => {
      const frame = image.closest(".portfolio-frame");
      if (frame && image.naturalWidth && image.naturalHeight) {
        frame.style.aspectRatio = `${image.naturalWidth} / ${image.naturalHeight}`;
      }
    };

    if (image.complete) {
      applyAspectRatio();
      requestAnimationFrame(() => layoutPortfolioGrid(container));
    } else {
      image.addEventListener("load", () => {
        applyAspectRatio();
        layoutPortfolioGrid(container);
      }, { once: true });
    }
  });
};

const layoutPortfolioGrid = (container = document.querySelector("[data-portfolio]")) => {
  if (!container) return;

  const styles = getComputedStyle(container);
  const gap = Number.parseInt(styles.getPropertyValue("--portfolio-gap"), 10) || 18;
  const minColumnWidth = Number.parseInt(styles.getPropertyValue("--portfolio-min-column"), 10) || 250;
  const containerWidth = container.clientWidth;
  const columnCount = Math.max(1, Math.floor((containerWidth + gap) / (minColumnWidth + gap)));
  const columnWidth = (containerWidth - gap * (columnCount - 1)) / columnCount;
  const columnHeights = Array(columnCount).fill(0);
  const cards = [...container.querySelectorAll(".portfolio-card")];

  cards.forEach((card) => {
    card.style.width = `${columnWidth}px`;
    card.style.transform = "translate3d(0, 0, 0)";
  });

  cards.forEach((card) => {
    const targetColumn = columnHeights.indexOf(Math.min(...columnHeights));
    const x = targetColumn * (columnWidth + gap);
    const y = columnHeights[targetColumn];

    card.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    columnHeights[targetColumn] += card.offsetHeight + gap;
  });

  const contentHeight = Math.max(0, ...columnHeights) - gap;
  container.style.height = `${Math.max(0, contentHeight)}px`;
  container.classList.remove("is-clipped");
};

const closePortfolioViewer = () => {
  const viewer = document.querySelector(".portfolio-viewer");
  if (!viewer) return;

  const video = viewer.querySelector("video");
  video?.pause();
  viewer.remove();
  document.body.classList.remove("viewer-open");
};

const openPortfolioViewer = (item) => {
  if (!item?.src) return;

  closePortfolioViewer();

  const media = item.type === "video"
    ? `
      <video class="viewer-media" controls autoplay ${item.poster ? `poster="${escapeAttr(item.poster)}"` : ""}>
        <source src="${escapeAttr(item.src)}">
        ${labels.unsupportedVideo}
      </video>
    `
    : `<img class="viewer-media" src="${escapeAttr(item.src)}" alt="${escapeAttr(item.alt || item.title || labels.aiWork)}">`;

  const viewer = document.createElement("div");
  viewer.className = "portfolio-viewer";
  viewer.setAttribute("role", "dialog");
  viewer.setAttribute("aria-modal", "true");
  viewer.innerHTML = `
    <button class="viewer-backdrop" type="button" aria-label="${labels.closePreview}"></button>
    <figure class="viewer-panel">
      <button class="viewer-close" type="button" aria-label="${labels.closePreview}">${labels.closeSymbol}</button>
      <div class="viewer-stage">${media}</div>
      <figcaption class="viewer-caption">
        <span>${escapeHtml(item.category || "")}${item.year ? ` / ${escapeHtml(item.year)}` : ""}</span>
        <strong>${escapeHtml(item.title || "")}</strong>
        <p>${escapeHtml(item.description || "")}</p>
      </figcaption>
    </figure>
  `;

  document.body.appendChild(viewer);
  document.body.classList.add("viewer-open");
  viewer.querySelector(".viewer-close")?.focus();
};

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-portfolio-index]");
  if (trigger) {
    const container = trigger.closest("[data-portfolio]");
    const items = getVisiblePortfolioItems(container);
    const item = items[Number(trigger.dataset.portfolioIndex)];
    openPortfolioViewer(item);
    return;
  }

  if (event.target.closest(".viewer-close") || event.target.closest(".viewer-backdrop")) {
    closePortfolioViewer();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePortfolioViewer();
  }
});

document.addEventListener("click", (event) => {
  const filterButton = event.target.closest("[data-portfolio-filter]");
  if (!filterButton) return;

  activePortfolioFilter = filterButton.dataset.portfolioFilter || "all";
  document.querySelectorAll("[data-portfolio-filter]").forEach((button) => {
    button.classList.toggle("active", button === filterButton);
  });
  renderPortfolio();
});

document.addEventListener("click", (event) => {
  const categoryButton = event.target.closest("[data-post-category]");
  if (!categoryButton) return;

  activePostCategory = categoryButton.dataset.postCategory || "all";
  document.querySelectorAll("[data-post-category]").forEach((button) => {
    button.classList.toggle("active", button === categoryButton);
  });
  renderPosts();
});

document.querySelector("[data-post-search]")?.addEventListener("input", () => {
  renderPosts();
});

document.addEventListener("click", async (event) => {
  const copyButton = event.target.closest("[data-copy-code]");
  if (!copyButton) return;

  const code = copyButton.closest(".article-code")?.querySelector("code")?.innerText || "";
  if (!code) return;

  try {
    await navigator.clipboard.writeText(code);
    copyButton.textContent = labels.copied;
    window.setTimeout(() => {
      copyButton.textContent = labels.copy;
    }, 1400);
  } catch {
    copyButton.textContent = labels.copyFailed;
    window.setTimeout(() => {
      copyButton.textContent = labels.copy;
    }, 1400);
  }
});

window.addEventListener("resize", () => {
  document.querySelectorAll("[data-portfolio]:not(.portfolio-grid-home)").forEach((container) => layoutPortfolioGrid(container));
});

updateMeta();
setText("[data-site-name]", config.siteName);
setText("[data-footer-name]", config.siteName);
setText("[data-site-initial]", config.siteInitial);
setText("[data-hero-kicker]", config.hero?.kicker);
setText("[data-hero-title]", config.hero?.title);
setText("[data-hero-description]", config.hero?.description);
setText("[data-latest-title]", config.latest?.title);
setText("[data-latest-summary]", config.latest?.summary);
setText("[data-intro-title]", config.intro?.title);
setText("[data-intro-description]", config.intro?.description);
setText("[data-profile-initial]", config.about?.initial);
setText("[data-about-title]", config.about?.title);
setText("[data-about-description]", config.about?.description);
renderPostTools();
renderPosts();
renderPortfolio();
renderTopics();
renderLinks();

document.getElementById("year").textContent = new Date().getFullYear();
