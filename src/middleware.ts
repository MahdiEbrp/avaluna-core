import { NextResponse, type NextRequest } from "next/server";
import { SECURITY, UI } from "./config/constants";
import { UI_LOCALE_COOKIE, UI_LOCALES, parseUiLocale } from "./domain/ui-locale";
import { createCspNonce, documentContentSecurityPolicy } from "./lib/csp";

export function middleware(request: NextRequest) {
  const nonce = createCspNonce();
  const policy = documentContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(SECURITY.CSP_NONCE_HEADER, nonce);
  requestHeaders.set("Content-Security-Policy", policy);
  const langParam = request.nextUrl.searchParams.get(UI.LANG_QUERY);
  const locale = parseUiLocale(langParam ?? request.cookies.get(UI_LOCALE_COOKIE)?.value);
  requestHeaders.set("x-avaluna-locale", locale);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  if (langParam && (UI_LOCALES as readonly string[]).includes(langParam)) {
    response.cookies.set(UI_LOCALE_COOKIE, locale, { path: "/", sameSite: "lax" });
  }
  return response;
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)"],
};
