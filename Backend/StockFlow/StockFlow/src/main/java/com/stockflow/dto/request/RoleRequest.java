package com.stockflow.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Payload to create or rename a role")
public class RoleRequest {

    @Schema(example = "AUDITOR", description = "Uppercase with underscores only (e.g. AUDITOR, REGIONAL_MANAGER)")
    @NotBlank(message = "Role name is required")
    @Size(min = 3, max = 50, message = "Role name must be between 3 and 50 characters")
    @Pattern(regexp = "^[A-Z][A-Z0-9_]*$",
            message = "Role name must be UPPERCASE and may contain underscores/digits only")
    private String name;
}
