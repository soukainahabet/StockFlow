package com.stockflow.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Payload to create or update a product")
public class ProductRequest {

    @Schema(example = "Coca-Cola 33cl", maxLength = 150)
    @NotBlank(message = "Product name is required")
    @Size(max = 150, message = "Product name must be at most 150 characters")
    private String name;

    @Schema(example = "1.50", description = "Unit price, > 0")
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    @Digits(integer = 8, fraction = 2, message = "Price must have at most 8 integer digits and 2 decimals")
    private BigDecimal price;

    @Schema(example = "100", description = "Current stock quantity")
    @NotNull(message = "Quantity is required")
    @PositiveOrZero(message = "Quantity cannot be negative")
    private Integer quantity;

    @Schema(example = "10", description = "Low stock threshold; triggers alert when quantity reaches it")
    @NotNull(message = "Alert threshold is required")
    @PositiveOrZero(message = "Alert threshold cannot be negative")
    private Integer alertThreshold;

    @Schema(example = "1")
    @NotNull(message = "Category ID is required")
    @Positive(message = "Category ID must be positive")
    private Long categoryId;
}
