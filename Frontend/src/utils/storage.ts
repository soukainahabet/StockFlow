import type { AuthResponse } from "@/types";

const TOKEN_KEY = "stockflow.token";
const USER_KEY = "stockflow.user";

export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export type StoredUser = Omit<AuthResponse, "token" | "type">;

export const userStorage = {
  get(): StoredUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  },
  set(user: StoredUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
};
