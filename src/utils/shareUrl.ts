export const PUBLIC_APP_ORIGIN =
  'https://ais-pre-fpeqhkgs7zvsj6fm325z6x-289165168867.asia-southeast1.run.app';

/**
 * AI Studio preview environments serve the private workspace on `ais-dev-*`
 * (which only opens for the authenticated project owner) and the shareable
 * public deployment on `ais-pre-*`. Any time we generate a link to copy,
 * WhatsApp-share, embed in a QR code, or send via email, normalize `ais-dev-`
 * to `ais-pre-` so friends and external visitors can open it.
 */
export function normalizePublicOrigin(origin: string): string {
  const clean = origin.trim().replace(/\/+$/, '');
  if (!clean) return PUBLIC_APP_ORIGIN;
  if (clean.includes('://ais-dev-')) {
    return clean.replace('://ais-dev-', '://ais-pre-');
  }
  return clean;
}

export function getPublicShareOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return normalizePublicOrigin(window.location.origin);
  }
  return PUBLIC_APP_ORIGIN;
}

export function buildPublicShareUrl(pathWithQuery: string = '/'): string {
  const base = getPublicShareOrigin();
  const suffix = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`;
  return `${base}${suffix}`;
}
