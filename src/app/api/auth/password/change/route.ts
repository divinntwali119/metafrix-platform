import { proxyBackendRequest } from "@/lib/server/backend-proxy";

export async function POST(request: Request) {
  return proxyBackendRequest(request, ["auth", "password", "change/"]);
}
