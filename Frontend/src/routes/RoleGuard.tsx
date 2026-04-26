import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import type { Role } from "@/types";

interface Props {
  allowed: Role[];
  redirectTo?: string;
}

export function RoleGuard({ allowed, redirectTo = "/dashboard" }: Props) {
  const { hasRole } = useAuth();
  if (!hasRole(...allowed)) {
    return <Navigate to={redirectTo} replace />;
  }
  return <Outlet />;
}
