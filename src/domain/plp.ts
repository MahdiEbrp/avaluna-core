import { PAGINATION, UI } from "../config/constants";

export type PlpSortKey = "newest" | "price_asc" | "price_desc" | "rating" | "name";

export const PLP_SORTS: Record<PlpSortKey, { sort: string; order: "asc" | "desc" }> = {
  newest: { sort: "created_at", order: "desc" },
  price_asc: { sort: "price", order: "asc" },
  price_desc: { sort: "price", order: "desc" },
  rating: { sort: "rating", order: "desc" },
  name: { sort: "name", order: "asc" },
};

export const PLP_SORT_KEYS = Object.keys(PLP_SORTS) as PlpSortKey[];

export type PlpQueryState = {
  page: number;
  pageSize: number;
  sortKey: PlpSortKey;
  search: string;
  category: string;
  onSale: boolean;
  inStock: boolean;
  minPrice: string;
  maxPrice: string;
};

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function parsePlpSort(sort: string, order: string): PlpSortKey {
  const pair = `${sort}:${order}`;
  if (pair === "price:asc") return "price_asc";
  if (pair === "price:desc") return "price_desc";
  if (sort === "rating") return "rating";
  if (sort === "name" || sort === "title") return "name";
  return "newest";
}

export function parsePlpQuery(raw: Record<string, string | string[] | undefined>): PlpQueryState {
  const pageRaw = Number.parseInt(first(raw.page) || String(PAGINATION.DEFAULT_PAGE), 10);
  const sortKey = parsePlpSort(first(raw.sort), first(raw.order));
  return {
    page: Number.isFinite(pageRaw) && pageRaw >= PAGINATION.DEFAULT_PAGE ? pageRaw : PAGINATION.DEFAULT_PAGE,
    pageSize: UI.PLP.PAGE_SIZE,
    sortKey,
    search: (first(raw.search) || first(raw.q)).slice(0, UI.SEARCH.MAX_LENGTH),
    category: first(raw.category),
    onSale: first(raw.on_sale) === "true",
    inStock: first(raw.in_stock) === "true",
    minPrice: first(raw.min_price),
    maxPrice: first(raw.max_price),
  };
}

export function plpToSearchParams(state: PlpQueryState): URLSearchParams {
  const params = new URLSearchParams();
  params.set("status", "published");
  params.set("catalog_visibility", "visible");
  params.set("page", String(state.page));
  params.set("page_size", String(state.pageSize));
  const pair = PLP_SORTS[state.sortKey];
  params.set("sort", pair.sort);
  params.set("order", pair.order);
  if (state.search) params.set("search", state.search);
  if (state.category) params.set("category", state.category);
  if (state.onSale) params.set("on_sale", "true");
  if (state.inStock) params.set("in_stock", "true");
  if (state.minPrice) params.set("min_price", state.minPrice);
  if (state.maxPrice) params.set("max_price", state.maxPrice);
  return params;
}

export function plpHref(
  basePath: string,
  state: PlpQueryState,
  patch: Partial<PlpQueryState>,
  options: { keepPage?: boolean } = {},
): string {
  const next: PlpQueryState = { ...state, ...patch };
  if (!options.keepPage && !("page" in patch)) {
    next.page = PAGINATION.DEFAULT_PAGE;
  }
  const params = new URLSearchParams();
  if (next.search) params.set("q", next.search);
  if (next.category && !basePath.startsWith("/categories/")) params.set("category", next.category);
  if (next.onSale) params.set("on_sale", "true");
  if (next.inStock) params.set("in_stock", "true");
  if (next.minPrice) params.set("min_price", next.minPrice);
  if (next.maxPrice) params.set("max_price", next.maxPrice);
  if (next.sortKey !== "newest") {
    const pair = PLP_SORTS[next.sortKey];
    params.set("sort", pair.sort);
    params.set("order", pair.order);
  }
  if (next.page > PAGINATION.DEFAULT_PAGE) params.set("page", String(next.page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function plpHasActiveFilters(state: PlpQueryState, categoryLocked: boolean): boolean {
  if (state.onSale || state.inStock || state.minPrice || state.maxPrice) return true;
  if (!categoryLocked && state.category) return true;
  if (state.sortKey !== "newest") return true;
  if (state.search) return true;
  return false;
}
