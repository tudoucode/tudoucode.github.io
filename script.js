const root = document.documentElement;
const themeButton = document.querySelector(".theme-toggle");
const savedTheme = localStorage.getItem("theme");
const config = window.siteConfig || {};
const portfolioItems = Array.isArray(window.autoPortfolio) && window.autoPortfolio.length > 0
  ? window.autoPortfolio
  : config.portfolio;
let activePortfolioFilter = "all";

if (savedTheme) {
  root.dataset.theme = savedTheme;
}

themeButton?.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = nextTheme;
  localStorage.setItem("theme", nextTheme);
});

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

const updateMeta = () => {
  if (config.siteName) {
    document.title = config.siteName;
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", config.siteName);
  }

  if (config.description) {
    document.querySelector('meta[name="description"]')?.setAttribute("content", config.description);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", config.description);
  }
};

const renderPosts = () => {
  const container = document.querySelector("[data-posts]");
  if (!container || !Array.isArray(config.posts)) return;
  const limit = container.dataset.postLimit;
  const posts = limit === "all" ? config.posts : config.posts.slice(0, 3);

  container.innerHTML = posts.map((post, index) => `
    <article class="post-card ${index === 0 ? "featured" : ""}">
      <div class="post-media ${post.mediaClass || "media-code"}" aria-hidden="true"></div>
      <div class="post-body">
        <div class="meta">
          <span>${post.category || "文章"}</span>
          <time datetime="${post.date || ""}">${formatDate(post.date)}</time>
        </div>
        <h3><a href="${post.url || "#"}">${post.title || ""}</a></h3>
        <p>${post.summary || ""}</p>
      </div>
    </article>
  `).join("");
};

const renderTopics = () => {
  const container = document.querySelector("[data-topics]");
  if (!container || !Array.isArray(config.topics)) return;

  container.innerHTML = config.topics.map((topic, index) => `
    <a href="#">
      <span>${String(index + 1).padStart(2, "0")}</span>
      <strong>${topic.title || ""}</strong>
      <em>${topic.description || ""}</em>
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
      <a class="contact-link" href="${href}"${attrs} aria-label="${link.label || "Link"}: ${detail}">
        <span class="contact-label">${link.label || "Link"}</span>
        <span class="contact-detail">${detail}</span>
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
      return `
        <div class="portfolio-placeholder placeholder-${(index % 4) + 1}" aria-hidden="true">
          <span>VIDEO</span>
        </div>
      `;
    }

    return `
      <img class="portfolio-media" src="${item.poster}" alt="${item.title || "AI 视频封面"}" loading="lazy">
      <span class="video-badge" aria-hidden="true"></span>
    `;
  }

  return `<img class="portfolio-media" src="${item.src}" alt="${item.alt || item.title || "AI 作品"}" loading="lazy">`;
};

const escapeAttr = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");

const renderPortfolio = () => {
  const container = document.querySelector("[data-portfolio]");
  if (!container || !Array.isArray(portfolioItems)) return;
  const limit = container.dataset.portfolioLimit;
  const homeLimit = Number(config.homePortfolioLimit || 6);
  const isHomeGrid = container.classList.contains("portfolio-grid-home");
  const filteredItems = activePortfolioFilter === "all"
    ? portfolioItems
    : portfolioItems.filter((item) => item.type === activePortfolioFilter);
  const items = limit === "all" || isHomeGrid ? filteredItems : filteredItems.slice(0, homeLimit);

  container.innerHTML = items.map((item, index) => `
    <article class="portfolio-card">
      <button class="portfolio-frame" type="button" ${item.src ? "" : "disabled"} data-portfolio-index="${index}" aria-label="预览 ${escapeAttr(item.title || "AI 作品")}">
        ${renderPortfolioMedia(item, index)}
        ${item.src ? '<span class="portfolio-open">点击预览</span>' : ""}
      </button>
    </article>
  `).join("");

  requestAnimationFrame(() => layoutPortfolioGrid(container));
  container.querySelectorAll("img").forEach((image) => {
    if (image.complete) {
      requestAnimationFrame(() => layoutPortfolioGrid(container));
    } else {
      image.addEventListener("load", () => layoutPortfolioGrid(container), { once: true });
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
  const fixedHomeHeight = Number.parseInt(styles.getPropertyValue("--portfolio-home-height"), 10) || 520;
  const isHomeGrid = container.classList.contains("portfolio-grid-home");
  const visibleHeight = isHomeGrid ? Math.min(contentHeight, fixedHomeHeight) : contentHeight;

  container.style.height = `${Math.max(0, visibleHeight)}px`;
  container.classList.toggle("is-clipped", isHomeGrid && contentHeight > fixedHomeHeight);
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
        当前浏览器不支持视频播放。
      </video>
    `
    : `<img class="viewer-media" src="${escapeAttr(item.src)}" alt="${escapeAttr(item.alt || item.title || "AI 作品")}">`;

  const viewer = document.createElement("div");
  viewer.className = "portfolio-viewer";
  viewer.setAttribute("role", "dialog");
  viewer.setAttribute("aria-modal", "true");
  viewer.innerHTML = `
    <button class="viewer-backdrop" type="button" aria-label="关闭预览"></button>
    <figure class="viewer-panel">
      <button class="viewer-close" type="button" aria-label="关闭预览">×</button>
      <div class="viewer-stage">${media}</div>
      <figcaption class="viewer-caption">
        <strong>${item.title || ""}</strong>
        <p>${item.description || ""}</p>
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
    const limit = container?.dataset.portfolioLimit;
    const homeLimit = Number(config.homePortfolioLimit || 6);
    const isHomeGrid = container?.classList.contains("portfolio-grid-home");
    const filteredItems = activePortfolioFilter === "all"
      ? portfolioItems
      : portfolioItems.filter((item) => item.type === activePortfolioFilter);
    const items = limit === "all" || isHomeGrid ? filteredItems : filteredItems.slice(0, homeLimit);
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

window.addEventListener("resize", () => {
  document.querySelectorAll("[data-portfolio]").forEach((container) => layoutPortfolioGrid(container));
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
renderPosts();
renderPortfolio();
renderTopics();
renderLinks();

document.getElementById("year").textContent = new Date().getFullYear();
