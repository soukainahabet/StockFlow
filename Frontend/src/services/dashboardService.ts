import { api, unwrap } from "./api";
import type {
  ApiResponse,
  DashboardSummary,
  DashboardTotals,
  ProductResponse,
  VenteResponse,
} from "@/types";

interface TopProduct {
  productName: string;
  totalQuantity: number;
  [k: string]: unknown;
}

export const dashboardService = {
  getTotals: () =>
    unwrap<DashboardTotals>(api.get<ApiResponse<DashboardTotals>>("/api/dashboard/total-ventes")),

  getLowStock: () =>
    unwrap<ProductResponse[]>(api.get<ApiResponse<ProductResponse[]>>("/api/dashboard/low-stock")),

  getTopProducts: (limit = 10) =>
    unwrap<TopProduct[]>(
      api.get<ApiResponse<TopProduct[]>>("/api/dashboard/top-products", { params: { limit } }),
    ),

  getRecentVentes: (limit = 10) =>
    unwrap<VenteResponse[]>(
      api.get<ApiResponse<VenteResponse[]>>("/api/dashboard/recent-ventes", { params: { limit } }),
    ),

  getSummary: () =>
    unwrap<DashboardSummary>(api.get<ApiResponse<DashboardSummary>>("/api/dashboard/summary")),
};
