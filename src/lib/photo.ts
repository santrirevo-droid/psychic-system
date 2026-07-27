/** Routes a stored photo URL through /api/photo so private Blob store objects (and access control) work uniformly. */
export function photoSrc(url: string | null): string | undefined {
  if (!url) return undefined;
  return `/api/photo?u=${encodeURIComponent(url)}`;
}

/**
 * Vercel's Serverless Functions hard-cap the request body at 4.5MB, below
 * which point the platform itself rejects the request (with a non-JSON
 * error body) before our route code ever runs. Kept under that with room
 * for multipart overhead.
 */
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
export const MAX_PHOTO_LABEL = "4MB";

/**
 * Parses a fetch Response as JSON, tolerating non-JSON error bodies (e.g. a
 * platform-level "Request Entity Too Large" page) instead of throwing a raw
 * parse error the user would see as a cryptic crash.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return { error: `Server menolak permintaan (${res.status}).` };
  }
}
