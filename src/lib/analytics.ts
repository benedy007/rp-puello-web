const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export function withUtm(href: string) {
  if (typeof window === "undefined") return href;
  const incoming = new URLSearchParams(window.location.search);
  const url = new URL(href);
  for (const key of UTM_KEYS) {
    const value = incoming.get(key);
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

export function track(
  event: string,
  detail: Record<string, string | number> = {},
) {
  if (typeof window === "undefined") return;
  const w = window as Window & { dataLayer?: Record<string, unknown>[] };
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({
    event,
    page_path: window.location.pathname,
    ...detail,
  });
}
