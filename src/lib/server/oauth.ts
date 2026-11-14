import { createHash, randomBytes } from "node:crypto";
import {
  createRemoteJWKSet,
  decodeJwt,
  jwtVerify,
  type JWTPayload,
} from "jose";
import { readServerSecret } from "@/lib/server/secrets";

export type OAuthProvider = "google" | "microsoft";

export interface OAuthProviderConfig {
  provider: OAuthProvider;
  clientId: string;
  clientSecret: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scope: string;
  jwks: ReturnType<typeof createRemoteJWKSet>;
}

export interface VerifiedOAuthProfile {
  provider: OAuthProvider;
  subject: string;
  email: string;
  emailVerified: boolean;
  name: string;
}

const googleJwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);
const microsoftJwks = createRemoteJWKSet(
  new URL("https://login.microsoftonline.com/common/discovery/v2.0/keys"),
);

const microsoftTenantPattern =
  /^(common|organizations|consumers|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export function isOAuthProvider(value: string): value is OAuthProvider {
  return value === "google" || value === "microsoft";
}

export function getAppBaseUrl(): URL {
  const configuredUrl = process.env.APP_BASE_URL;
  const baseUrl = configuredUrl || (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "");
  if (!baseUrl) throw new Error("APP_BASE_URL is not configured.");

  const parsedUrl = new URL(baseUrl);
  if (process.env.NODE_ENV === "production" && parsedUrl.protocol !== "https:") {
    throw new Error("APP_BASE_URL must use HTTPS in production.");
  }
  return parsedUrl;
}

export function getOAuthProviderConfig(
  provider: OAuthProvider,
): OAuthProviderConfig | null {
  if (provider === "google") {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = readServerSecret("GOOGLE_CLIENT_SECRET");
    if (!clientId || !clientSecret) return null;

    return {
      provider,
      clientId,
      clientSecret,
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      scope: "openid email profile",
      jwks: googleJwks,
    };
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID?.trim();
  const clientSecret = readServerSecret("MICROSOFT_CLIENT_SECRET");
  const tenantId = process.env.MICROSOFT_TENANT_ID?.trim() || "common";
  if (!clientId || !clientSecret || !microsoftTenantPattern.test(tenantId)) return null;

  const authority = `https://login.microsoftonline.com/${tenantId}`;
  return {
    provider,
    clientId,
    clientSecret,
    authorizationEndpoint: `${authority}/oauth2/v2.0/authorize`,
    tokenEndpoint: `${authority}/oauth2/v2.0/token`,
    scope: "openid email profile User.Read",
    jwks: microsoftJwks,
  };
}

export function createRandomOAuthValue(): string {
  return randomBytes(32).toString("base64url");
}

export function createPkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export async function exchangeOAuthCode(
  config: OAuthProviderConfig,
  code: string,
  redirectUri: string,
  codeVerifier: string,
): Promise<{ idToken: string; accessToken?: string }> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    code_verifier: codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
  const response = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const tokens = (await response.json().catch(() => ({}))) as {
    id_token?: unknown;
    access_token?: unknown;
  };
  if (!response.ok || typeof tokens.id_token !== "string") {
    throw new Error("OAuth code exchange failed.");
  }

  return {
    idToken: tokens.id_token,
    accessToken: typeof tokens.access_token === "string" ? tokens.access_token : undefined,
  };
}

export async function verifyOAuthIdToken(
  config: OAuthProviderConfig,
  idToken: string,
  expectedNonce: string,
  accessToken?: string,
): Promise<VerifiedOAuthProfile> {
  let claims: JWTPayload;
  if (config.provider === "google") {
    ({ payload: claims } = await jwtVerify(idToken, config.jwks, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: config.clientId,
      algorithms: ["RS256"],
    }));
  } else {
    const unverifiedClaims = decodeJwt(idToken);
    const tenantId = typeof unverifiedClaims.tid === "string" ? unverifiedClaims.tid : "";
    const issuer = typeof unverifiedClaims.iss === "string" ? unverifiedClaims.iss : "";
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId) ||
      issuer !== `https://login.microsoftonline.com/${tenantId}/v2.0`
    ) {
      throw new Error("Microsoft ID token issuer is invalid.");
    }
    ({ payload: claims } = await jwtVerify(idToken, config.jwks, {
      issuer,
      audience: config.clientId,
      algorithms: ["RS256"],
    }));
  }

  if (typeof claims.sub !== "string" || !claims.sub || claims.nonce !== expectedNonce) {
    throw new Error("OAuth ID token claims are invalid.");
  }

  let email = typeof claims.email === "string" ? claims.email : "";
  let name = typeof claims.name === "string" ? claims.name : "";
  if (config.provider === "microsoft" && (!email || !name) && accessToken) {
    const response = await fetch(
      "https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (response.ok) {
      const profile = (await response.json()) as {
        displayName?: unknown;
        mail?: unknown;
        userPrincipalName?: unknown;
      };
      if (!email && typeof profile.mail === "string") email = profile.mail;
      if (!email && typeof profile.userPrincipalName === "string") email = profile.userPrincipalName;
      if (!name && typeof profile.displayName === "string") name = profile.displayName;
    }
  }

  if (!email || !email.includes("@")) {
    throw new Error("OAuth provider did not return an e-mail address.");
  }

  return {
    provider: config.provider,
    subject: claims.sub,
    email: email.trim().toLowerCase(),
    emailVerified: claims.email_verified === true,
    name: name.trim(),
  };
}