export type HttpPost = (
  url: string,
  body: unknown,
  headers?: Record<string, string>,
) => Promise<{ status: number; json: unknown }>;

export const defaultHttpPost: HttpPost = async (url, body, headers = {}) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  let json: unknown = {};
  try {
    json = await response.json();
  } catch {
    json = {};
  }
  return { status: response.status, json };
};

let current: HttpPost = defaultHttpPost;

export function setAdapterHttp(post: HttpPost): void {
  current = post;
}

export function resetAdapterHttp(): void {
  current = defaultHttpPost;
}

export function adapterHttp(): HttpPost {
  return current;
}
