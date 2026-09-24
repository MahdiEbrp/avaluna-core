import { originAllowed } from "../domain/csrf";
import { ApiError } from "./errors";
import { loadSettings, readMerged } from "./settings/store";

export async function assertShopOrigin(request: Request): Promise<void> {
  const map = await loadSettings();
  const shopOrigin = readMerged(map, "general", "shop_origin");
  const origin = request.headers.get("origin");
  const hostHeader = request.headers.get("host");
  const host = hostHeader || new URL(request.url).host;
  if (!originAllowed(origin, shopOrigin, host)) {
    throw new ApiError(403, "csrf.origin_denied", "Request origin is not allowed.");
  }
}
