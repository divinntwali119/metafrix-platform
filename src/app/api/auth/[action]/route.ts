import { NextResponse } from "next/server";

import {
  isSameOriginMutation,
  requestBackend,
  setAuthCookies,
} from "@/lib/server/backend-proxy";

interface RouteContext {
  params: Promise<{ action: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ detail: "Origine de requête non autorisée." }, { status: 403 });
  }

  const { action } = await params;
  if (action !== "login" && action !== "register") {
    return NextResponse.json({ detail: "Action d’authentification inconnue." }, { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ detail: "Corps JSON invalide." }, { status: 400 });
  }

  let backendResponse: Response;
  try {
    backendResponse = await requestBackend(`auth/${action}/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json(
      { detail: "Le service backend est temporairement indisponible." },
      { status: 502 },
    );
  }

  const responseData = await backendResponse.json().catch(() => ({}));
  if (!backendResponse.ok) {
    return NextResponse.json(responseData, { status: backendResponse.status });
  }

  const tokens = responseData as { access?: string; refresh?: string; user?: unknown };
  if (!tokens.access || !tokens.refresh || !tokens.user) {
    return NextResponse.json({ detail: "Réponse d’authentification invalide." }, { status: 502 });
  }

  const response = NextResponse.json(
    { user: tokens.user },
    { status: backendResponse.status },
  );
  setAuthCookies(response, { access: tokens.access, refresh: tokens.refresh });
  return response;
}
