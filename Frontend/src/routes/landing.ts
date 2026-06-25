import type { Role } from "@/types";

const DASHBOARD_ROLES: Role[] = ["ADMIN", "MANAGER"];

export function landingRouteForRole(role: Role | undefined): string {
  if (!role) return "/login";
  if (DASHBOARD_ROLES.includes(role)) return "/dashboard";
  return "/products";
}
