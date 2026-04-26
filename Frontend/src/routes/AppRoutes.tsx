import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { ProductsPage } from "@/features/products/ProductsPage";
import { CategoriesPage } from "@/features/categories/CategoriesPage";
import { VentesPage } from "@/features/ventes/VentesPage";
import { VenteCreatePage } from "@/features/ventes/VenteCreatePage";
import { StockMovementsPage } from "@/features/stock/StockMovementsPage";
import { UsersPage } from "@/features/users/UsersPage";
import { RolesPage } from "@/features/roles/RolesPage";
import { PrivateRoute } from "./PrivateRoute";
import { RoleGuard } from "./RoleGuard";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<PrivateRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/ventes" element={<VentesPage />} />
          <Route path="/ventes/new" element={<VenteCreatePage />} />
          <Route path="/stock-movements" element={<StockMovementsPage />} />

          <Route element={<RoleGuard allowed={["ADMIN"]} />}>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/roles" element={<RolesPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
