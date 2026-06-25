package com.stockflow.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Payload to create or update a CUSTOM role. SYSTEM roles are read-only.")
public class RoleRequest {

    @Schema(example = "AUDITOR", description = "Uppercase with underscores only (e.g. AUDITOR, REGIONAL_MANAGER)")
    @NotBlank(message = "Role name is required")
    @Size(min = 3, max = 50, message = "Role name must be between 3 and 50 characters")
    @Pattern(regexp = "^[A-Z][A-Z0-9_]*$",
            message = "Role name must be UPPERCASE and may contain underscores/digits only")
    private String name;

    @Schema(description = "Whether the role is active. Inactive roles cannot be assigned to new users.",
            example = "true")
    private Boolean active;

    @Schema(description = "Permission keys granted to this role. CUSTOM roles start with an empty set; "
            + "permissions can be added later. SYSTEM roles ignore this field.")
    private Set<String> permissions;
}
