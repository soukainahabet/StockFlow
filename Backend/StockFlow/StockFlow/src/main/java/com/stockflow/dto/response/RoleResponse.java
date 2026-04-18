package com.stockflow.dto.response;

import com.stockflow.model.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Role representation")
public class RoleResponse {

    @Schema(example = "1")
    private Long id;

    @Schema(example = "ADMIN")
    private String name;

    @Schema(description = "Whether this role is reserved by the system and cannot be deleted/renamed", example = "true")
    private boolean systemRole;

    public static RoleResponse fromEntity(Role role, boolean systemRole) {
        return RoleResponse.builder()
                .id(role.getId())
                .name(role.getName())
                .systemRole(systemRole)
                .build();
    }
}
