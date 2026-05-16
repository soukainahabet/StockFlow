import { api, unwrap } from "./api";
import type {
  ApiResponse,
  ProfitSummaryDto,
  TopProductDto,
} from "@/types";

export const analyticsService = {
  topProducts: (limit = 10) =>
    unwrap<TopProductDto[]>(
      api.get<ApiResponse<TopProductDto[]>>("/api/analytics/top-products", {
        params: { limit },
      }),
    ),

  profitProducts: (limit = 10) =>
    unwrap<ProfitSummaryDto>(
      api.get<ApiResponse<ProfitSummaryDto>>(
        "/api/analytics/profit-products",
        { params: { limit } },
      ),
    ),
};
