package com.stockflow.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Payload to update a user (partial update — fields left null are ignored)")
public class UserUpdateRequest {

    @Schema(example = "John Doe", maxLength = 100)
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @Schema(example = "john@example.com", maxLength = 150)
    @Email(message = "Invalid email format")
    @Size(max = 150, message = "Email must be at most 150 characters")
    private String email;

    @Schema(example = "newPassword123", minLength = 6, maxLength = 100)
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    private String password;

    @Schema(
            example = "MANAGER",
            allowableValues = {"ADMIN", "STOCK_MANAGER", "SELLER", "MANAGER"}
    )
    private String roleName;
}
