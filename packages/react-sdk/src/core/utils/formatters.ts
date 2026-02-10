/**
 * Normalize timestamp to milliseconds. Returns null if invalid.
 * Accepts seconds or milliseconds; supports numeric strings from API.
 */
export function toValidTimestamp(ts: unknown): number | null {
  if (ts == null) return null;
  const n = Number(ts);
  if (!Number.isFinite(n)) return null;
  const ms = n > 1e12 ? n : n * 1000;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return null;
  return ms;
}

/**
 * Format a message timestamp for display.
 * @param ts Unix time in milliseconds (or seconds if < 1e12, for backward compatibility)
 */
export function formatMessageTime(ts: number): string {
  const ms = ts > 1e12 ? ts : ts * 1000;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "";
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return Math.floor(sec / 60) + "m ago";
  if (sec < 86400) return Math.floor(sec / 3600) + "h ago";
  if (sec < 604800) return Math.floor(sec / 86400) + "d ago";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: ms < Date.now() - 365 * 86400 * 1000 ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
  });
}
