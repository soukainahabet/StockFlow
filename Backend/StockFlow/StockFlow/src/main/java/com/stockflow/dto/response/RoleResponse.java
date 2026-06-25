package com.stockflow.dto.response;

import com.stockflow.model.Permission;
import com.stockflow.model.Role;
import com.stockflow.model.RoleType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

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

    @Schema(description = "SYSTEM roles are reserved and immutable. CUSTOM roles are operator-managed.",
            example = "SYSTEM")
    private RoleType type;

    @Schema(description = "Inactive CUSTOM roles are hidden from the user-assignment picker.", example = "true")
    private boolean active;

    @Schema(description = "Permission codes granted to this role.",
            example = "[\"PRODUCT_READ\",\"STOCK_WRITE\"]")
    private Set<String> permissions;

    /** Legacy alias kept for older frontend builds: equivalent to {@code type == SYSTEM}. */
    @Schema(description = "Deprecated: use {@code type == SYSTEM} instead.", example = "true")
    private boolean systemRole;

    public static RoleResponse fromEntity(Role role) {
        Set<String> codes = role.getPermissions() == null
                ? new HashSet<>()
                : role.getPermissions().stream().map(Permission::getCode).collect(java.util.stream.Collectors.toCollection(HashSet::new));
        return RoleResponse.builder()
                .id(role.getId())
                .name(role.getName())
                .type(role.getType())
                .active(role.isActive())
                .permissions(codes)
                .systemRole(role.isSystem())
                .build();
    }
}
