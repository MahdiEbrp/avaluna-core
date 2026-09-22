import { jsonOk } from "@/lib/http";
import { completeSetup, isSetupComplete } from "@/lib/services/setup";
import { ApiError } from "@/lib/errors";

export async function handlePublicSetup(method: string, resource: string, body: unknown): Promise<Response | null> {
  if (resource !== "setup") {
    return null;
  }
  if (method === "GET") {
    return jsonOk({ initialized: await isSetupComplete() });
  }
  if (method === "POST") {
    return jsonOk(await completeSetup(body), { status: 201 });
  }
  throw new ApiError(405, "setup.method_not_allowed", "Use GET or POST for setup.");
}
