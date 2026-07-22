import { getStorageItem, setStorageItem } from "./browser";

const INDEX_KEY = "ld_bookmark_url_index";
let indexSet = null;
let seededAt = 0;

function normalize(url) {
  const i = url.indexOf("#");
  return i === -1 ? url : url.slice(0, i);
}

export function resetForTesting() {
  indexSet = null;
  seededAt = 0;
}

async function ensureLoaded() {
  if (indexSet) return;
  const json = await getStorageItem(INDEX_KEY);
  if (json) {
    const data = JSON.parse(json);
    indexSet = new Set(data.urls || []);
    seededAt = data.seededAt || 0;
  } else {
    indexSet = new Set();
    seededAt = 0;
  }
}

async function persist() {
  await setStorageItem(
    INDEX_KEY,
    JSON.stringify({ urls: [...indexSet], seededAt }),
  );
}

export async function isBookmarked(url) {
  await ensureLoaded();
  const n = normalize(url);
  if (indexSet.has(n)) return true;
  const alt = n.endsWith("/") ? n.slice(0, -1) : n + "/";
  return indexSet.has(alt);
}

export async function addUrl(url) {
  await ensureLoaded();
  const n = normalize(url);
  indexSet.add(n);
  const alt = n.endsWith("/") ? n.slice(0, -1) : n + "/";
  indexSet.add(alt);
  await persist();
}

export async function removeUrl(url) {
  await ensureLoaded();
  const n = normalize(url);
  indexSet.delete(n);
  const alt = n.endsWith("/") ? n.slice(0, -1) : n + "/";
  indexSet.delete(alt);
  await persist();
}

export async function getSeededAt() {
  await ensureLoaded();
  return seededAt;
}

export async function seedFromServer(api) {
  const urls = await api.getAllBookmarkUrls();
  const normalized = urls.map(normalize);
  indexSet = new Set(normalized);
  seededAt = Date.now();
  await persist();
}
