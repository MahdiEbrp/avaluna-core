"use client";

import { Title } from "@mantine/core";
import Link from "next/link";
import type { UiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";
import type { HomeCard, HomeCategory } from "../../lib/services/home";
import type { MoneyProfile } from "../../lib/money/profile";
import { ProductCard } from "./ProductCard";

type SectionProps = {
  locale: UiLocale;
  title: string;
  products: HomeCard[];
  profile: MoneyProfile;
  testId: string;
  viewAllHref?: string;
};

export function ProductSection({ locale, title, products, profile, testId, viewAllHref }: SectionProps) {
  const t = (key: string) => uiCopy(locale, key);
  if (products.length === 0) return null;
  return (
    <section className="shop-home-section" data-testid={testId} aria-labelledby={`${testId}-title`}>
      <div className="shop-home-section__head">
        <Title order={2} id={`${testId}-title`} className="shop-home-section__title">
          {title}
        </Title>
        {viewAllHref ? (
          <Link href={viewAllHref} className="shop-home-section__more" data-testid={`${testId}.more`}>
            {t("shop.home.viewAll")}
          </Link>
        ) : null}
      </div>
      <div className={testId === "home.deals" ? "shop-rail" : "shop-grid"} data-testid={`${testId}.list`}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            locale={locale}
            product={product}
            profile={profile}
            testId={`product.card.${product.id}`}
          />
        ))}
      </div>
    </section>
  );
}

type CategoryProps = {
  locale: UiLocale;
  categories: HomeCategory[];
};

export function CategoryTiles({ locale, categories }: CategoryProps) {
  const t = (key: string) => uiCopy(locale, key);
  if (categories.length === 0) return null;
  return (
    <section className="shop-home-section" data-testid="home.categories" aria-labelledby="home.categories-title">
      <div className="shop-home-section__head">
        <Title order={2} id="home.categories-title" className="shop-home-section__title">
          {t("shop.home.categoriesTitle")}
        </Title>
      </div>
      <ul className="shop-cats" data-testid="home.categories.list">
        {categories.map((category) => {
          const letter = [...category.name][0] ?? "?";
          return (
            <li key={category.id}>
              <Link
                href={`/categories/${category.slug}`}
                className="shop-cats__item"
                data-testid={`home.cat.${category.slug}`}
              >
                <span className="shop-cats__tile" aria-hidden>
                  {letter}
                </span>
                <span className="shop-cats__label">{category.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
