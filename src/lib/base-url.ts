/**
 * Canonical public origin for links that leave the app (WhatsApp messages,
 * emails, share links).
 *
 * A request's own origin is NOT safe to use for this. Behind Hostinger's proxy
 * the Node process is bound to 0.0.0.0:3000 and `request.nextUrl.origin`
 * resolves to `https://0.0.0.0:3000`, which produced unreachable product links
 * in every WhatsApp enquiry. The configured public URL is the only reliable
 * source, so it wins; the request origin is a last resort and is rejected when
 * it is a bind or loopback address.
 */

const UNROUTABLE_HOST = /^(0\.0\.0\.0|127\.0\.0\.1|localhost|\[::\]|\[::1\])(:\d+)?$/i;

function clean(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, "");
}

/** True when an origin can never be opened by someone outside the server. */
export function isUnroutableOrigin(origin: string): boolean {
  try {
    return UNROUTABLE_HOST.test(new URL(origin).host);
  } catch {
    return true;
  }
}

export function getPublicBaseUrl(requestOrigin?: string): string {
  // NEXT_PUBLIC_APP_URL is inlined at build time, so it is only present when it
  // was set before the build ran. BETTER_AUTH_URL is read live from the
  // environment and covers the case where it was not.
  const configured = clean(process.env.NEXT_PUBLIC_APP_URL) ?? clean(process.env.BETTER_AUTH_URL);
  if (configured) return configured;

  const fromRequest = clean(requestOrigin);
  if (fromRequest && !isUnroutableOrigin(fromRequest)) return fromRequest;

  return "";
}
