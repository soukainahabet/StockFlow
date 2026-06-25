import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import type { Role } from "@/types";
import { landingRouteForRole } from "./landing";

interface Props {
  allowed: Role[];
  redirectTo?: string;
}

export function RoleGuard({ allowed, redirectTo }: Props) {
  const { hasRole, user } = useAuth();
  if (!hasRole(...allowed)) {
    return <Navigate to={redirectTo ?? landingRouteForRole(user?.role)} replace />;
  }
  return <Outlet />;
}
