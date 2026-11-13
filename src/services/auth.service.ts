import { apiClient } from "./api";
import { User } from "@/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
}

const authFieldLabels: Record<string, string> = {
  name: "Nom complet",
  username: "Nom d’utilisateur",
  email: "Adresse e-mail",
  password: "Mot de passe",
  non_field_errors: "Formulaire",
};

function collectErrorMessages(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectErrorMessages);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectErrorMessages);
  }
  return [];
}

function getAuthErrorMessage(data: unknown, status: number): string {
  const payload = data && typeof data === "object" && !Array.isArray(data)
    ? data as Record<string, unknown>
    : {};

  for (const key of ["detail", "message", "error"]) {
    if (typeof payload[key] === "string" && payload[key]) {
      return payload[key] as string;
    }
  }

  const fieldMessages = Object.entries(payload).flatMap(([field, value]) => {
    const label = authFieldLabels[field] || field;
    return collectErrorMessages(value).map((message) => `${label} : ${message}`);
  });
  if (fieldMessages.length) return fieldMessages.join(" · ");

  if (status === 429) return "Trop de tentatives. Attendez quelques minutes puis réessayez.";
  if (status === 502 || status === 503) {
    return "Le service backend est indisponible. Vérifiez que l’API Django est démarrée.";
  }
  if (status >= 500) return "Le serveur a rencontré une erreur. Vérifiez le backend et réessayez.";
  if (status === 403) return "La requête a été refusée. Rechargez la page puis réessayez.";
  if (status === 400) return "Les informations du formulaire sont invalides. Vérifiez les champs.";
  return "La requête a échoué. Réessayez.";
}

async function postAuth<T>(path: string, payload?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: payload === undefined ? undefined : { "Content-Type": "application/json" },
      body: payload === undefined ? undefined : JSON.stringify(payload),
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new Error("Impossible de contacter l’application. Vérifiez que le serveur Next.js est démarré.");
  }
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(getAuthErrorMessage(data, response.status));
  }
  return data as T;
}

export const authService = {
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await postAuth("/api/auth/password/change/", {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  async login(credentials: LoginPayload): Promise<{ user: User }> {
    return postAuth("/api/auth/login/", credentials);
  },

  async register(data: RegisterPayload): Promise<{ user: User }> {
    return postAuth("/api/auth/register/", data);
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get("/users/me/");
    return response.data;
  },

  async updateProfile(data: {
    name: string;
    bio: string;
    location: string;
    website: string;
  }): Promise<User> {
    const response = await apiClient.patch("/users/me/", data);
    return response.data;
  },

  async logout(): Promise<void> {
    await postAuth<void>("/api/auth/logout/");
  },
};
