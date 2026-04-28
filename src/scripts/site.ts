export {};

const root = document.documentElement;
const themeButton = document.querySelector<HTMLButtonElement>(".theme-toggle");
const savedTheme = localStorage.getItem("theme");

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

const layoutPortfolioGrid = (container: HTMLElement | null = document.querySelector("[data-portfolio]")) => {
  if (!container || container.classList.contains("portfolio-grid-home")) return;

  const styles = getComputedStyle(container);
  const gap = Number.parseInt(styles.getPropertyValue("--portfolio-gap"), 10) || 18;
  const minColumnWidth = Number.parseInt(styles.getPropertyValue("--portfolio-min-column"), 10) || 250;
  const containerWidth = container.clientWidth;
  const columnCount = Math.max(1, Math.floor((containerWidth + gap) / (minColumnWidth + gap)));
  const columnWidth = (containerWidth - gap * (columnCount - 1)) / columnCount;
  const columnHeights = Array(columnCount).fill(0);
  const cards = [...container.querySelectorAll<HTMLElement>(".portfolio-card:not([hidden])")];

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
};

const layoutAllPortfolioGrids = () => {
  document.querySelectorAll<HTMLElement>("[data-portfolio]:not(.portfolio-grid-home)").forEach(layoutPortfolioGrid);
};

const closePortfolioViewer = () => {
  const viewer = document.querySelector(".portfolio-viewer");
  if (!viewer) return;
  viewer.querySelector("video")?.pause();
  viewer.remove();
  document.body.classList.remove("viewer-open");
};

const openPortfolioViewer = (trigger: HTMLElement) => {
  const src = trigger.dataset.src;
  if (!src) return;

  closePortfolioViewer();

  const mediaType = trigger.dataset.mediaType;
  const title = trigger.dataset.title || "";
  const category = trigger.dataset.category || "";
  const year = trigger.dataset.year || "";
  const description = trigger.dataset.description || "";
  const poster = trigger.dataset.poster || "";
  const source = src.startsWith("/") ? src : `/${src}`;
  const posterAttr = poster ? ` poster="${poster.startsWith("/") ? poster : `/${poster}`}"` : "";
  const media = mediaType === "video"
    ? `<video class="viewer-media" controls autoplay${posterAttr}><source src="${source}">当前浏览器不支持视频播放。</video>`
    : `<img class="viewer-media" src="${source}" alt="${escapeHtml(title || "AI 作品")}">`;

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
        <span>${escapeHtml(category)}${year ? ` / ${escapeHtml(year)}` : ""}</span>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(description)}</p>
      </figcaption>
    </figure>
  `;
  document.body.appendChild(viewer);
  document.body.classList.add("viewer-open");
  viewer.querySelector<HTMLButtonElement>(".viewer-close")?.focus();
};

document.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const portfolioTrigger = target.closest<HTMLElement>("[data-portfolio-index]");
  if (portfolioTrigger) {
    openPortfolioViewer(portfolioTrigger);
    return;
  }

  if (target.closest(".viewer-close") || target.closest(".viewer-backdrop")) {
    closePortfolioViewer();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePortfolioViewer();
  }
});

document.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-portfolio-filter]");
  if (!button) return;

  const filter = button.dataset.portfolioFilter || "all";
  document.querySelectorAll<HTMLButtonElement>("[data-portfolio-filter]").forEach((item) => {
    item.classList.toggle("active", item === button);
  });
  document.querySelectorAll<HTMLElement>("[data-portfolio-card]").forEach((card) => {
    card.hidden = filter !== "all" && card.dataset.type !== filter;
  });
  requestAnimationFrame(layoutAllPortfolioGrids);
});

const filterPosts = () => {
  const query = document.querySelector<HTMLInputElement>("[data-post-search]")?.value.trim().toLowerCase() || "";
  const activeCategory = document.querySelector<HTMLButtonElement>("[data-post-category].active")?.dataset.postCategory || "all";
  let visibleCount = 0;

  document.querySelectorAll<HTMLElement>("[data-post-card]").forEach((card) => {
    const matchesCategory = activeCategory === "all" || card.dataset.category === activeCategory;
    const matchesSearch = !query || (card.dataset.search || "").includes(query);
    card.hidden = !(matchesCategory && matchesSearch);
    if (!card.hidden) visibleCount += 1;
  });

  const emptyState = document.querySelector<HTMLElement>("[data-empty-posts]");
  if (emptyState) emptyState.hidden = visibleCount > 0;
};

document.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-post-category]");
  if (!button) return;

  document.querySelectorAll<HTMLButtonElement>("[data-post-category]").forEach((item) => {
    item.classList.toggle("active", item === button);
  });
  filterPosts();
});

document.querySelector<HTMLInputElement>("[data-post-search]")?.addEventListener("input", filterPosts);

const enhanceCodeBlocks = () => {
  document.querySelectorAll<HTMLElement>(".article-body pre").forEach((pre) => {
    if (pre.parentElement?.classList.contains("article-code")) return;

    const code = pre.querySelector("code");
    const languageClass = [...(code?.classList || [])].find((className) => className.startsWith("language-"));
    const language = languageClass?.replace("language-", "") || "code";
    const wrapper = document.createElement("div");
    wrapper.className = "article-code";
    wrapper.innerHTML = `
      <div class="code-toolbar">
        <span>${escapeHtml(language)}</span>
        <button type="button" data-copy-code>复制</button>
      </div>
    `;
    pre.replaceWith(wrapper);
    wrapper.appendChild(pre);
  });
};

document.addEventListener("click", async (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-copy-code]");
  if (!button) return;

  const code = button.closest(".article-code")?.querySelector("code")?.textContent || "";
  if (!code) return;

  try {
    await navigator.clipboard.writeText(code);
    button.textContent = "已复制";
    window.setTimeout(() => {
      button.textContent = "复制";
    }, 1400);
  } catch {
    button.textContent = "复制失败";
    window.setTimeout(() => {
      button.textContent = "复制";
    }, 1400);
  }
});

window.addEventListener("resize", layoutAllPortfolioGrids);
window.addEventListener("load", layoutAllPortfolioGrids);
document.querySelectorAll<HTMLImageElement>("[data-portfolio] img").forEach((image) => {
  image.addEventListener("load", layoutAllPortfolioGrids, { once: true });
});

enhanceCodeBlocks();

const year = document.getElementById("year");
if (year) {
  year.textContent = new Date().getFullYear().toString();
}
