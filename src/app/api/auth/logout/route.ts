import { cookies } from "next/headers";

import {
  clearAuthCookies,
  proxyBackendRequest,
} from "@/lib/server/backend-proxy";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const refresh = cookieStore.get("metafrix_refresh")?.value;
  const response = await proxyBackendRequest(request, ["auth", "logout/"], {
    body: JSON.stringify({ refresh }),
  });
  clearAuthCookies(response);
  return response;
}
