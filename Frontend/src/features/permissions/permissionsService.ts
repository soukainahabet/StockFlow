import { api, unwrap } from "@/services/api";
import type { ApiResponse, PermissionResponse } from "@/types";

export const permissionsService = {
  listAll: () =>
    unwrap<PermissionResponse[]>(
      api.get<ApiResponse<PermissionResponse[]>>("/api/permissions"),
    ),
};
