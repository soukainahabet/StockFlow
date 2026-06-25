import { api, unwrap } from "@/services/api";
import type {
  ApiResponse,
  PageResponse,
  RoleRequest,
  RoleResponse,
  RoleType,
} from "@/types";

export interface RoleSearchParams {
  page?: number;
  size?: number;
  sort?: string;
  type?: RoleType;
  active?: boolean;
}

export const rolesService = {
  list: (params: RoleSearchParams = {}) =>
    unwrap<PageResponse<RoleResponse>>(
      api.get<ApiResponse<PageResponse<RoleResponse>>>("/api/roles", { params }),
    ),

  listAll: async (): Promise<RoleResponse[]> => {
    const page = await rolesService.list({ page: 0, size: 200 });
    return page.content;
  },

  /** SYSTEM + active CUSTOM, ready for the user-assignment picker. */
  listAssignable: () =>
    unwrap<RoleResponse[]>(
      api.get<ApiResponse<RoleResponse[]>>("/api/roles/assignable"),
    ),

  getById: (id: number) =>
    unwrap<RoleResponse>(api.get<ApiResponse<RoleResponse>>(`/api/roles/${id}`)),

  create: (body: RoleRequest) =>
    unwrap<RoleResponse>(api.post<ApiResponse<RoleResponse>>("/api/roles", body)),

  update: (id: number, body: RoleRequest) =>
    unwrap<RoleResponse>(api.put<ApiResponse<RoleResponse>>(`/api/roles/${id}`, body)),

  remove: (id: number) => unwrap<void>(api.delete<ApiResponse<void>>(`/api/roles/${id}`)),
};
