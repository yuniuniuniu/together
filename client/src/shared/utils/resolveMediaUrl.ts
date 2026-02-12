export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) {
    return undefined;
  }

  const normalized = url.trim();
  if (!normalized) {
    return undefined;
  }

  // Only accept absolute URLs (or browser-managed URL schemes).
  if (
    /^https?:\/\//i.test(normalized) ||
    normalized.startsWith('blob:') ||
    normalized.startsWith('data:') ||
    normalized.startsWith('file:') ||
    normalized.startsWith('content:') ||
    normalized.startsWith('capacitor:')
  ) {
    return normalized;
  }

  if (normalized.startsWith('//')) {
    return `${window.location.protocol}${normalized}`;
  }

  return undefined;
}
