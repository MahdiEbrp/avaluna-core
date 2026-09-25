import Link from "next/link";
import type { UiLocale } from "../../../domain/ui-locale";
import { uiCopy } from "../../../lib/locale/ui-copy";

type Crumb = { label: string; href?: string };

type Props = {
  locale: UiLocale;
  crumbs: Crumb[];
};

export function PdpBreadcrumbs({ locale, crumbs }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  if (crumbs.length === 0) return null;
  return (
    <nav aria-label={t("shop.a11y.nav")} className="shop-pdp__crumbs" data-testid="pdp.crumbs">
      <ol className="shop-pdp__crumb-list">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${index}`}>
              {crumb.href && !last ? (
                <Link href={crumb.href} data-testid={`pdp.crumb.${index}`}>
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} data-testid={`pdp.crumb.${index}`}>
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
