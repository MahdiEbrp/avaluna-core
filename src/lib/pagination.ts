import { pageCount } from "../domain/pagination";

export { parsePage } from "../domain/pagination";

export function paginatedHeaders(total: number, page: number, pageSize: number): Headers {
  const headers = new Headers();
  headers.set("X-Total-Count", String(total));
  headers.set("X-Total-Pages", String(pageCount(total, pageSize)));
  headers.set("X-Page", String(page));
  headers.set("X-Page-Size", String(pageSize));
  return headers;
}
