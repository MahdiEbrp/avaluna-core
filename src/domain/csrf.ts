export function originAllowed(originHeader: string | null, shopOrigin: string, requestHost: string): boolean {
  if (!originHeader) {
    return true;
  }
  let origin: URL;
  try {
    origin = new URL(originHeader);
  } catch {
    return false;
  }
  if (origin.host === requestHost) {
    return true;
  }
  if (!shopOrigin) {
    return false;
  }
  try {
    return new URL(shopOrigin).host === origin.host;
  } catch {
    return shopOrigin === originHeader;
  }
}

export function assertOrigin(originHeader: string | null, shopOrigin: string, requestHost: string): void {
  if (!originAllowed(originHeader, shopOrigin, requestHost)) {
    throw Object.assign(new Error("Origin is not allowed."), { name: "CsrfError" });
  }
}
