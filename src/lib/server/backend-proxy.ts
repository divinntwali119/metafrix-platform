import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ACCESS_COOKIE = "metafrix_access";
const REFRESH_COOKIE = "metafrix_refresh";
const ACCESS_MAX_AGE = 10 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

type AuthTokens = { access: string; refresh: string };

function backendBaseUrl(): string {
  const baseUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8001";
  return `${baseUrl.replace(/\/+$/, "")}/api/`;
}

export function isSameOriginMutation(request: Request): boolean {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;

  const requestOrigin = new URL(request.url).origin;
  if (origin) return origin === requestOrigin;

  const referer = request.headers.get("referer");
  if (!referer) return false;
  try {
    return new URL(referer).origin === requestOrigin;
  } catch {
    return false;
  }
}

export async function requestBackend(
  path: string,
  options: {
    method: string;
    body?: BodyInit;
    accessToken?: string;
    search?: string;
    contentType?: string | null;
  },
): Promise<Response> {
  const headers = new Headers({ Accept: "application/json" });
  if (options.body !== undefined) {
    headers.set("Content-Type", options.contentType || "application/json");
  }
  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  const normalizedPath = path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join("/");
  const url = new URL(normalizedPath ? `${normalizedPath}/` : "", backendBaseUrl());
  if (options.search) {
    url.search = options.search;
  }

  return fetch(url, {
    method: options.method,
    headers,
    body: options.body,
    cache: "no-store",
    redirect: "manual",
  });
}

export function setAuthCookies(response: NextResponse, tokens: AuthTokens): void {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(ACCESS_COOKIE, tokens.access, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refresh, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
}

export async function proxyBackendRequest(
  request: Request,
  pathSegments: string[],
  options: { body?: BodyInit; method?: string; checkOrigin?: boolean } = {},
): Promise<NextResponse> {
  const method = options.method || request.method;
  if (
    options.checkOrigin !== false &&
    !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase()) &&
    !isSameOriginMutation(request)
  ) {
    return NextResponse.json({ detail: "Origine de requête non autorisée." }, { status: 403 });
  }

  const cookieStore = await cookies();
  const path = pathSegments.join("/");
  const search = new URL(request.url).search;
  let accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  let refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  let body = options.body;
  if (body === undefined && !["GET", "HEAD"].includes(method.toUpperCase())) {
    const bytes = await request.arrayBuffer();
    body = bytes.byteLength ? new Uint8Array(bytes) : undefined;
  }

  let backendResponse: Response;
  const requestContentType = options.body === undefined
    ? request.headers.get("content-type")
    : "application/json";
  try {
    backendResponse = await requestBackend(path, {
      method,
      body,
      accessToken,
      search,
      contentType: requestContentType,
    });
  } catch {
    return NextResponse.json(
      { detail: "Le service backend est temporairement indisponible." },
      { status: 502 },
    );
  }

  let refreshedTokens: AuthTokens | undefined;
  let clearCookies = false;
  if (backendResponse.status === 401 && refreshToken) {
    try {
      const refreshResponse = await requestBackend("auth/token/refresh/", {
        method: "POST",
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (refreshResponse.ok) {
        const tokenData = (await refreshResponse.json()) as { access: string; refresh?: string };
        accessToken = tokenData.access;
        refreshToken = tokenData.refresh || refreshToken;
        refreshedTokens = { access: accessToken, refresh: refreshToken };
        if (path === "auth/logout/") {
          body = JSON.stringify({ refresh: refreshToken });
        }
        backendResponse = await requestBackend(path, {
          method,
          body,
          accessToken,
          search,
          contentType: requestContentType,
        });
      } else {
        clearCookies = true;
      }
    } catch {
      clearCookies = true;
    }
  }

  const responseHeaders = new Headers();
  const contentType = backendResponse.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);
  const contentDisposition = backendResponse.headers.get("content-disposition");
  if (contentDisposition) responseHeaders.set("content-disposition", contentDisposition);
  responseHeaders.set("cache-control", "no-store");
  responseHeaders.set("x-content-type-options", "nosniff");

  const responseBody = [204, 304].includes(backendResponse.status) ? null : backendResponse.body;
  const response = new NextResponse(responseBody, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
  if (refreshedTokens) setAuthCookies(response, refreshedTokens);
  if (clearCookies) clearAuthCookies(response);
  return response;
}
