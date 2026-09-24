import { describe, expect, it } from "vitest";
import {
  PLP_SORT_KEYS,
  parsePlpQuery,
  parsePlpSort,
  plpHasActiveFilters,
  plpHref,
  plpToSearchParams,
} from "./plp";

const empty = {
  page: 1,
  pageSize: 12,
  sortKey: "newest" as const,
  search: "",
  category: "",
  onSale: false,
  inStock: false,
  minPrice: "",
  maxPrice: "",
};

describe("plp query", () => {
  it("parses every sort pair", () => {
    expect(parsePlpSort("price", "asc")).toBe("price_asc");
    expect(parsePlpSort("price", "desc")).toBe("price_desc");
    expect(parsePlpSort("rating", "desc")).toBe("rating");
    expect(parsePlpSort("name", "asc")).toBe("name");
    expect(parsePlpSort("title", "asc")).toBe("name");
    expect(parsePlpSort("created_at", "desc")).toBe("newest");
    expect(parsePlpSort("", "")).toBe("newest");
    expect(PLP_SORT_KEYS).toEqual(["newest", "price_asc", "price_desc", "rating", "name"]);
  });

  it("parses raw searchParams with defaults and array values", () => {
    const state = parsePlpQuery({
      q: "کیف",
      on_sale: "true",
      in_stock: ["true", "false"],
      page: "2",
      sort: "price",
      order: "asc",
      category: "fashion",
      min_price: "100",
      max_price: "900",
      sort_ignore: undefined,
    });
    expect(state.search).toBe("کیف");
    expect(state.onSale).toBe(true);
    expect(state.inStock).toBe(true);
    expect(state.page).toBe(2);
    expect(state.sortKey).toBe("price_asc");
    expect(state.category).toBe("fashion");
    expect(state.minPrice).toBe("100");
    expect(state.maxPrice).toBe("900");
    expect(state.pageSize).toBe(12);
  });

  it("falls back to search key and clamps invalid page", () => {
    expect(parsePlpQuery({ search: "hat" }).search).toBe("hat");
    expect(parsePlpQuery({}).page).toBe(1);
    expect(parsePlpQuery({ page: "0" }).page).toBe(1);
    expect(parsePlpQuery({ page: "abc" }).page).toBe(1);
    expect(parsePlpQuery({ page: ["9", "1"] }).page).toBe(9);
  });

  it("truncates long search to UI.SEARCH.MAX_LENGTH", () => {
    const long = "x".repeat(200);
    expect(parsePlpQuery({ q: long }).search).toHaveLength(80);
  });

  it("maps state to listProducts params", () => {
    const params = plpToSearchParams({
      ...empty,
      category: "fashion",
      onSale: true,
      inStock: true,
      minPrice: "100",
      maxPrice: "900",
      search: "bag",
      sortKey: "price_desc",
      page: 3,
    });
    expect(params.get("status")).toBe("published");
    expect(params.get("catalog_visibility")).toBe("visible");
    expect(params.get("category")).toBe("fashion");
    expect(params.get("on_sale")).toBe("true");
    expect(params.get("in_stock")).toBe("true");
    expect(params.get("min_price")).toBe("100");
    expect(params.get("max_price")).toBe("900");
    expect(params.get("search")).toBe("bag");
    expect(params.get("sort")).toBe("price");
    expect(params.get("order")).toBe("desc");
    expect(params.get("page")).toBe("3");
    expect(params.get("page_size")).toBe("12");
  });

  it("builds hrefs and resets page unless kept", () => {
    expect(plpHref("/products", { ...empty, page: 3 }, { onSale: true })).toBe("/products?on_sale=true");
    expect(plpHref("/products", { ...empty, page: 3 }, { page: 4 }, { keepPage: true })).toBe("/products?page=4");
    expect(plpHref("/products", { ...empty, page: 3 }, { page: 3 })).toBe("/products?page=3");
    expect(plpHref("/categories/fashion", { ...empty, category: "fashion" }, {})).toBe("/categories/fashion");
    expect(plpHref("/search", { ...empty, search: "hat" }, { search: "hat" })).toBe("/search?q=hat");
    expect(plpHref("/products", empty, { sortKey: "rating" })).toBe("/products?sort=rating&order=desc");
    expect(
      plpHref("/products", empty, {
        onSale: true,
        inStock: true,
        minPrice: "1",
        maxPrice: "2",
        category: "digital",
      }),
    ).toBe("/products?category=digital&on_sale=true&in_stock=true&min_price=1&max_price=2");
    expect(plpHref("/products", empty, { sortKey: "name" })).toBe("/products?sort=name&order=asc");
  });

  it("detects active filters", () => {
    expect(plpHasActiveFilters(empty, false)).toBe(false);
    expect(plpHasActiveFilters({ ...empty, onSale: true }, true)).toBe(true);
    expect(plpHasActiveFilters({ ...empty, inStock: true }, true)).toBe(true);
    expect(plpHasActiveFilters({ ...empty, minPrice: "1" }, true)).toBe(true);
    expect(plpHasActiveFilters({ ...empty, maxPrice: "9" }, true)).toBe(true);
    expect(plpHasActiveFilters({ ...empty, category: "fashion" }, false)).toBe(true);
    expect(plpHasActiveFilters({ ...empty, category: "fashion" }, true)).toBe(false);
    expect(plpHasActiveFilters({ ...empty, sortKey: "price_asc" }, true)).toBe(true);
    expect(plpHasActiveFilters({ ...empty, search: "hat" }, true)).toBe(true);
  });
});
