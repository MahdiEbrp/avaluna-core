import { GET as catchGet, POST as catchPost } from "./[...path]/route";

export async function GET(request: Request) {
  return catchGet(request, { params: Promise.resolve({ path: [] }) });
}
export async function POST(request: Request) {
  return catchPost(request, { params: Promise.resolve({ path: [] }) });
}
