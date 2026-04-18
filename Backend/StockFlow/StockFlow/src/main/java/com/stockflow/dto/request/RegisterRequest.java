package com.stockflow.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Payload to register a new user")
public class RegisterRequest {

    @Schema(example = "John Doe")
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @Schema(example = "john@example.com")
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 150, message = "Email must be at most 150 characters")
    private String email;

    @Schema(example = "secret123", minLength = 6)
    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    private String password;

    @Schema(
            example = "SELLER",
            description = "Role to assign. Defaults to SELLER if omitted.",
            allowableValues = {"ADMIN", "STOCK_MANAGER", "SELLER", "MANAGER"}
    )
    private String roleName;
}
