import { SECURITY } from "../config/constants";

const CSP_SEMI = "; ";

function nonceSource(nonce: string): string {
  return `'nonce-${nonce}'`;
}

/** Per-request document CSP. Nonce required so script-src has no 'unsafe-inline' or 'unsafe-eval'. */
export function documentContentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'strict-dynamic' ${nonceSource(nonce)}`,
    "script-src-attr 'none'",
    `style-src 'self' ${nonceSource(nonce)}`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join(CSP_SEMI);
}

/** JSON APIs execute no scripts; lock the policy without a page nonce. */
export function apiContentSecurityPolicy(): string {
  return SECURITY.CONTENT_SECURITY_POLICY;
}

export function createCspNonce(): string {
  const bytes = new Uint8Array(SECURITY.CSP_NONCE_BYTES);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
