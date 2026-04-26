import { api, unwrap } from "@/services/api";
import type {
  ApiResponse,
  PageResponse,
  UserResponse,
  UserUpdateRequest,
} from "@/types";

export interface UserSearchParams {
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const usersService = {
  list: (params: UserSearchParams = {}) =>
    unwrap<PageResponse<UserResponse>>(
      api.get<ApiResponse<PageResponse<UserResponse>>>("/api/users", { params }),
    ),

  getById: (id: number) =>
    unwrap<UserResponse>(api.get<ApiResponse<UserResponse>>(`/api/users/${id}`)),

  update: (id: number, body: UserUpdateRequest) =>
    unwrap<UserResponse>(api.put<ApiResponse<UserResponse>>(`/api/users/${id}`, body)),

  remove: (id: number) => unwrap<void>(api.delete<ApiResponse<void>>(`/api/users/${id}`)),
};
