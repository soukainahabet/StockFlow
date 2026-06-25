import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/services/authService";
import { registerUnauthorizedHandler } from "@/services/api";
import { tokenStorage, userStorage, type StoredUser } from "@/utils/storage";
import type { LoginRequest, RegisterRequest, Role } from "@/types";

interface AuthContextValue {
  user: StoredUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (body: LoginRequest) => Promise<StoredUser>;
  register: (body: RegisterRequest) => Promise<StoredUser>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
  /** True if the user inherits at least one of the given permission codes. */
  hasPermission: (...codes: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(() => userStorage.get());
  const [isInitializing, setIsInitializing] = useState<boolean>(() => Boolean(tokenStorage.get()));

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => setUser(null));
  }, []);

  // Validate token on app boot when one exists
  useEffect(() => {
    let cancelled = false;
    if (!tokenStorage.get()) {
      setIsInitializing(false);
      return;
    }
    (async () => {
      try {
        const me = await authService.me();
        if (cancelled) return;
        const stored: StoredUser = {
          id: me.id,
          name: me.name,
          email: me.email,
          role: me.role,
          permissions: me.permissions ?? [],
        };
        userStorage.set(stored);
        setUser(stored);
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = useCallback(async (body: LoginRequest) => {
    const res = await authService.login(body);
    tokenStorage.set(res.token);
    const stored: StoredUser = {
      id: res.id,
      name: res.name,
      email: res.email,
      role: res.role,
      permissions: res.permissions ?? [],
    };
    userStorage.set(stored);
    setUser(stored);
    return stored;
  }, []);

  const register = useCallback(async (body: RegisterRequest) => {
    const res = await authService.register(body);
    tokenStorage.set(res.token);
    const stored: StoredUser = {
      id: res.id,
      name: res.name,
      email: res.email,
      role: res.role,
      permissions: res.permissions ?? [],
    };
    userStorage.set(stored);
    setUser(stored);
    return stored;
  }, []);

  const hasRole = useCallback(
    (...roles: Role[]) => {
      if (!user) return false;
      if (roles.length === 0) return true;
      return roles.includes(user.role);
    },
    [user],
  );

  const hasPermission = useCallback(
    (...codes: string[]) => {
      if (!user) return false;
      if (codes.length === 0) return true;
      const owned = user.permissions ?? [];
      return codes.some((c) => owned.includes(c));
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      login,
      register,
      logout,
      hasRole,
      hasPermission,
    }),
    [user, isInitializing, login, register, logout, hasRole, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
