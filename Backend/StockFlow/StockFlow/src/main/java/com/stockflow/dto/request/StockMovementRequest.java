package com.stockflow.dto.request;

import com.stockflow.model.StockMovementType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Payload to record a stock movement (IN or OUT)")
public class StockMovementRequest {

    @Schema(example = "IN", description = "IN increases stock, OUT decreases it")
    @NotNull(message = "Movement type is required")
    private StockMovementType type;

    @Schema(example = "25")
    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be at least 1")
    private Integer quantity;

    @Schema(example = "1")
    @NotNull(message = "Product ID is required")
    @Positive(message = "Product ID must be positive")
    private Long productId;

    @Schema(example = "Réapprovisionnement fournisseur", description = "Optional human-readable reason for the movement")
    @Size(max = 255, message = "Reason must be at most 255 characters")
    private String reason;
}
