import { apiClient } from "./api";
import { User } from "@/types";

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password?: string;
}

export const authService = {
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post("/auth/password/change/", {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  async login(credentials: LoginPayload): Promise<{ token: string; user: User }> {
    try {
      const response = await apiClient.post("/auth/login/", credentials);
      return response.data;
    } catch {
      // Fallback response for frontend standalone demo
      return {
        token: "afrihub-demo-jwt-token",
        user: {
          id: "user-divin",
          username: "divin",
          name: "Divin Ndagano",
          email: credentials.email,
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          bio: "Lead Software Architect & Open Source enthusiast.",
          skills: ["TypeScript", "Next.js", "Python"],
          technologies: ["React", "FastAPI", "Tailwind CSS"],
          followersCount: 1420,
          followingCount: 385,
          repositoriesCount: 24,
          contributionsCount: 1842,
          createdAt: new Date().toISOString(),
        },
      };
    }
  },

  async register(data: RegisterPayload): Promise<{ token: string; user: User }> {
    try {
      const response = await apiClient.post("/auth/register/", data);
      return response.data;
    } catch {
      return {
        token: "afrihub-demo-jwt-token",
        user: {
          id: `user-${Date.now()}`,
          username: data.username,
          name: data.name,
          email: data.email,
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
          bio: "Nouveau membre de la communauté MetafriX.",
          skills: ["JavaScript", "Python"],
          technologies: ["Git", "Linux"],
          followersCount: 0,
          followingCount: 0,
          repositoriesCount: 0,
          contributionsCount: 1,
          createdAt: new Date().toISOString(),
        },
      };
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get("/users/me/");
    return response.data;
  },

  async logout(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem("afrihub_token");
    }
  },
};
