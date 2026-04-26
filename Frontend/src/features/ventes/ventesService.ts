import { api, unwrap } from "@/services/api";
import type {
  ApiResponse,
  PageResponse,
  VenteRequest,
  VenteResponse,
} from "@/types";

export interface VenteSearchParams {
  userId?: number;
  startDate?: string;
  endDate?: string;
  minTotal?: number;
  maxTotal?: number;
  page?: number;
  size?: number;
  sort?: string;
}

export const ventesService = {
  list: (params: VenteSearchParams = {}) =>
    unwrap<PageResponse<VenteResponse>>(
      api.get<ApiResponse<PageResponse<VenteResponse>>>("/api/ventes", { params }),
    ),

  getById: (id: number) =>
    unwrap<VenteResponse>(api.get<ApiResponse<VenteResponse>>(`/api/ventes/${id}`)),

  recent: (limit = 10) =>
    unwrap<VenteResponse[]>(
      api.get<ApiResponse<VenteResponse[]>>("/api/ventes/recent", { params: { limit } }),
    ),

  create: (body: VenteRequest) =>
    unwrap<VenteResponse>(api.post<ApiResponse<VenteResponse>>("/api/ventes", body)),

  remove: (id: number) =>
    unwrap<void>(api.delete<ApiResponse<void>>(`/api/ventes/${id}`)),
};
