package com.stockflow.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Admin-driven user creation payload (POST /api/users).
 * Unlike {@link RegisterRequest} (public self-service), this accepts any assignable role
 * — SYSTEM or active CUSTOM. The endpoint itself is gated to ADMIN by {@code SecurityConfig}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Payload to create a user from the admin UI")
public class UserCreateRequest {

    @Schema(example = "Alice Martin")
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @Schema(example = "alice@stockflow.com")
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 150, message = "Email must be at most 150 characters")
    private String email;

    @Schema(example = "secret123", minLength = 6)
    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    private String password;

    @Schema(example = "AUDITOR", description = "Role to assign. SYSTEM or active CUSTOM.")
    @NotBlank(message = "Role is required")
    private String roleName;
}
