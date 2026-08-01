import type { Item } from "./types";

/**
 * Everything goes through the proxy: uploads live in a private bucket, and
 * remote images must be same-origin for ColorThief to read their pixels.
 */
export function imgSrc(item: Item): string | null {
  if (item.storage_path) {
    return `/api/img?path=${encodeURIComponent(item.storage_path)}`;
  }
  if (item.image_url) {
    return `/api/img?url=${encodeURIComponent(item.image_url)}`;
  }
  return null;
}
