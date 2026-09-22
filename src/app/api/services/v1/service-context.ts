import type { AuthContext } from "@/lib/auth";

export type ServiceContext = {
  method: string;
  resource: string | undefined;
  idOrAction: string | undefined;
  nested: string | undefined;
  url: URL;
  body: unknown;
  auth: AuthContext;
  request: Request;
};

export type ServiceHandler = (ctx: ServiceContext) => Promise<Response | null>;
