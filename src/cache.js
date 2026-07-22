import { getStorageItem, setStorageItem } from "./browser";
import { getConfiguration, isConfigurationComplete } from "./configuration";
import { LinkdingApi } from "./linkding";
import { isBookmarked, seedFromServer, getSeededAt } from "./url-index";

const SERVER_METADATA_CACHE_KEY = "ld_server_metadata_cache";

export async function loadServerMetadata(url, precacheRequest = false) {
  const configuration = await getConfiguration();
  const hasCompleteConfiguration = isConfigurationComplete(configuration);

  // Skip if extension is not configured or URL is invalid
  if (!hasCompleteConfiguration || !url || !url.match(/^http(s)?:\/\//)) {
    return null;
  }

  // Check for cached metadata first
  const cachedMetadata = await getCachedServerMetadata();
  if (cachedMetadata && cachedMetadata.metadata.url === url) {
    return cachedMetadata;
  }

  if (precacheRequest) {
    // Badge path: use local index, never contacts the server
    if (await isBookmarked(url)) {
      return {
        bookmark: { url },
        metadata: { url, title: "", description: "" },
        auto_tags: [],
      };
    }
    return null;
  }

  // Popup path: fetch full metadata from server
  const api = new LinkdingApi(configuration);

  if (await getSeededAt() === 0) {
    seedFromServer(api).catch(() => {});
  }

  try {
    const tabMetadata = await api.check(url);
    // Linkding <v1.17 does not return full bookmark data from check API
    // In that case fetch the bookmark with a separate request
    if (tabMetadata.bookmark && !tabMetadata.bookmark.date_added) {
      tabMetadata.bookmark = await api.getBookmark(tabMetadata.bookmark.id);
    }
    await cacheServerMetadata(tabMetadata);
    return tabMetadata;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getCachedServerMetadata() {
  const json = await getStorageItem(SERVER_METADATA_CACHE_KEY);
  return json ? JSON.parse(json) : null;
}

export async function cacheServerMetadata(tabMetadata) {
  const json = JSON.stringify(tabMetadata);
  await setStorageItem(SERVER_METADATA_CACHE_KEY, json);
}

export async function clearCachedServerMetadata() {
  await cacheServerMetadata(null);
}
