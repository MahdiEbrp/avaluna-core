import { PAGINATION } from "../config/constants";

export function parsePage(search: URLSearchParams): { page: number; pageSize: number } {
  const pageRaw = Number.parseInt(search.get("page") ?? String(PAGINATION.DEFAULT_PAGE), 10);
  const sizeRaw = Number.parseInt(search.get("page_size") ?? search.get("per_page") ?? String(PAGINATION.DEFAULT_PAGE_SIZE), 10);
  const page = Number.isFinite(pageRaw) ? Math.max(PAGINATION.DEFAULT_PAGE, pageRaw) : PAGINATION.DEFAULT_PAGE;
  const bounded = Number.isFinite(sizeRaw) ? sizeRaw : PAGINATION.DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(PAGINATION.MAX_PAGE_SIZE, Math.max(PAGINATION.MIN_PAGE_SIZE, bounded));
  return { page, pageSize };
}

export function pageCount(total: number, pageSize: number): number {
  if (total <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(total / pageSize));
}

export function offsetOf(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}
