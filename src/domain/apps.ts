export function isAppSlug(slug: string): boolean {
  return /^[a-z][a-z0-9-]{1,62}[a-z0-9]$/.test(slug);
}

export function canInstallApp(requested: string[], granted: string[]): boolean {
  return requested.every((scope) => granted.includes(scope));
}
