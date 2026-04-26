import { api, unwrap } from "./api";
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, UserResponse } from "@/types";

export const authService = {
  login: (body: LoginRequest) =>
    unwrap<AuthResponse>(api.post<ApiResponse<AuthResponse>>("/auth/login", body)),

  register: (body: RegisterRequest) =>
    unwrap<AuthResponse>(api.post<ApiResponse<AuthResponse>>("/auth/register", body)),

  me: () => unwrap<UserResponse>(api.get<ApiResponse<UserResponse>>("/api/profile")),
};
