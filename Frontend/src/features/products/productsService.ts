import { api, unwrap } from "@/services/api";
import type {
  ApiResponse,
  PageResponse,
  ProductRequest,
  ProductResponse,
} from "@/types";

export interface ProductSearchParams {
  name?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  lowStock?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export const productsService = {
  list: (params: ProductSearchParams = {}) =>
    unwrap<PageResponse<ProductResponse>>(
      api.get<ApiResponse<PageResponse<ProductResponse>>>("/api/products", { params }),
    ),

  getById: (id: number) =>
    unwrap<ProductResponse>(api.get<ApiResponse<ProductResponse>>(`/api/products/${id}`)),

  lowStock: () =>
    unwrap<ProductResponse[]>(api.get<ApiResponse<ProductResponse[]>>("/api/products/low-stock")),

  create: (body: ProductRequest) =>
    unwrap<ProductResponse>(api.post<ApiResponse<ProductResponse>>("/api/products", body)),

  update: (id: number, body: ProductRequest) =>
    unwrap<ProductResponse>(api.put<ApiResponse<ProductResponse>>(`/api/products/${id}`, body)),

  remove: (id: number) =>
    unwrap<void>(api.delete<ApiResponse<void>>(`/api/products/${id}`)),
};
