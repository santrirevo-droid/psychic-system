/** Routes a stored photo URL through /api/photo so private Blob store objects (and access control) work uniformly. */
export function photoSrc(url: string | null): string | undefined {
  if (!url) return undefined;
  return `/api/photo?u=${encodeURIComponent(url)}`;
}
