import { api, unwrap } from "@/services/api";
import type {
  ApiResponse,
  PageResponse,
  StockMovementRequest,
  StockMovementResponse,
  StockMovementType,
} from "@/types";

export interface StockSearchParams {
  productId?: number;
  userId?: number;
  type?: StockMovementType;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const stockService = {
  list: (params: StockSearchParams = {}) =>
    unwrap<PageResponse<StockMovementResponse>>(
      api.get<ApiResponse<PageResponse<StockMovementResponse>>>("/api/stock-movements", { params }),
    ),

  getById: (id: number) =>
    unwrap<StockMovementResponse>(
      api.get<ApiResponse<StockMovementResponse>>(`/api/stock-movements/${id}`),
    ),

  byProduct: (productId: number, page = 0, size = 20) =>
    unwrap<PageResponse<StockMovementResponse>>(
      api.get<ApiResponse<PageResponse<StockMovementResponse>>>(
        `/api/stock-movements/product/${productId}`,
        { params: { page, size } },
      ),
    ),

  create: (body: StockMovementRequest) =>
    unwrap<StockMovementResponse>(
      api.post<ApiResponse<StockMovementResponse>>("/api/stock-movements", body),
    ),
};
