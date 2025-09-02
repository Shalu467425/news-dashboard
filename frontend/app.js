const newsList = document.getElementById("newsList");
const favoritesList = document.getElementById("favoritesList");
const refreshBtn = document.getElementById("refreshBtn");
const retryBtn = document.getElementById("retryBtn");
const lastUpdated = document.getElementById("lastUpdated");
const spinner = document.getElementById("loadingSpinner");

const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const limitSelect = document.getElementById("limitSelect");

let newsData = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

// Format "time ago"
function timeAgo(dateStr) {
  const diff = (new Date() - new Date(dateStr)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function renderNews() {
  newsList.innerHTML = "";

  const query = searchInput.value.toLowerCase();
  const category = categorySelect.value;
  const limit = parseInt(limitSelect.value);

  let filtered = newsData.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(query);
    const matchesCategory = category === "all" || item.category === category;
    return matchesSearch && matchesCategory;
  });

  filtered.slice(0, limit).forEach(item => {
    const li = document.createElement("li");

    const content = document.createElement("div");
    content.className = "news-content";

    const title = document.createElement("p");
    title.className = "news-title";
    title.innerHTML = `<a href="${item.url}" target="_blank">${item.title}</a>`;

    const meta = document.createElement("p");
    meta.className = "news-meta";
    meta.textContent = `${item.source} • ${timeAgo(item.publishedAt)}`;

    content.appendChild(title);
    content.appendChild(meta);

    const star = document.createElement("button");
    star.className = "star-btn";
    star.textContent = favorites.some(f => f.url === item.url) ? "⭐" : "☆";
    star.onclick = () => toggleFavorite(item);

    li.appendChild(content);
    li.appendChild(star);
    newsList.appendChild(li);
  });

  renderFavorites();
}

function renderFavorites() {
  favoritesList.innerHTML = "";
  favorites.forEach(item => {
    const li = document.createElement("li");

    const content = document.createElement("div");
    content.className = "news-content";

    const title = document.createElement("p");
    title.className = "news-title";
    title.innerHTML = `<a href="${item.url}" target="_blank">${item.title}</a>`;

    const meta = document.createElement("p");
    meta.className = "news-meta";
    meta.textContent = `${item.source} • ${timeAgo(item.publishedAt)}`;

    content.appendChild(title);
    content.appendChild(meta);

    li.appendChild(content);
    favoritesList.appendChild(li);
  });
}

function toggleFavorite(item) {
  const exists = favorites.find(f => f.url === item.url);
  if (exists) {
    favorites = favorites.filter(f => f.url !== item.url);
  } else {
    favorites.push(item);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderNews();
}

async function fetchLatestNews() {
  spinner.classList.remove("hidden");
  retryBtn.classList.add("hidden");

  try {
    const res = await fetch("/api/latest");
    if (!res.ok) throw new Error("Failed to load news");

    newsData = await res.json();
    renderNews();

    const now = new Date();
    lastUpdated.textContent = `🔄 Auto-updated: ${now.getHours()}:${String(now.getMinutes()).padStart(2,"0")}`;
  } catch (err) {
    console.error(err);
    retryBtn.classList.remove("hidden");
  } finally {
    spinner.classList.add("hidden");
  }
}

async function refreshNews() {
  spinner.classList.remove("hidden");
  try {
    await fetch("/api/refresh");
    await fetchLatestNews();
  } catch (err) {
    console.error("Refresh failed", err);
    retryBtn.classList.remove("hidden");
  } finally {
    spinner.classList.add("hidden");
  }
}

// Event Listeners
refreshBtn.addEventListener("click", refreshNews);
retryBtn.addEventListener("click", fetchLatestNews);
searchInput.addEventListener("input", renderNews);
categorySelect.addEventListener("change", renderNews);
limitSelect.addEventListener("change", renderNews);

// Initial load
fetchLatestNews();
setInterval(fetchLatestNews, 5 * 60 * 1000); // Auto-refresh every 5 minutes
