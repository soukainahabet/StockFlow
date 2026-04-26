import { api, unwrap } from "@/services/api";
import type {
  ApiResponse,
  CategoryRequest,
  CategoryResponse,
  PageResponse,
} from "@/types";

export interface CategorySearchParams {
  name?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const categoriesService = {
  list: (params: CategorySearchParams = {}) =>
    unwrap<PageResponse<CategoryResponse>>(
      api.get<ApiResponse<PageResponse<CategoryResponse>>>("/api/categories", { params }),
    ),

  listAll: async (): Promise<CategoryResponse[]> => {
    const page = await categoriesService.list({ page: 0, size: 500 });
    return page.content;
  },

  getById: (id: number) =>
    unwrap<CategoryResponse>(api.get<ApiResponse<CategoryResponse>>(`/api/categories/${id}`)),

  create: (body: CategoryRequest) =>
    unwrap<CategoryResponse>(api.post<ApiResponse<CategoryResponse>>("/api/categories", body)),

  update: (id: number, body: CategoryRequest) =>
    unwrap<CategoryResponse>(api.put<ApiResponse<CategoryResponse>>(`/api/categories/${id}`, body)),

  remove: (id: number) =>
    unwrap<void>(api.delete<ApiResponse<void>>(`/api/categories/${id}`)),
};
