import { proxyBackendRequest } from "@/lib/server/backend-proxy";

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

async function proxy(request: Request, { params }: RouteContext) {
  const { path } = await params;
  return proxyBackendRequest(request, path);
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
