package com.stockflow.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Single line inside a vente")
public class LigneVenteRequest {

    @Schema(example = "1")
    @NotNull(message = "Product ID is required")
    @Positive(message = "Product ID must be positive")
    private Long productId;

    @Schema(example = "2")
    @NotNull(message = "Quantite is required")
    @Positive(message = "Quantite must be at least 1")
    private Integer quantite;
}
