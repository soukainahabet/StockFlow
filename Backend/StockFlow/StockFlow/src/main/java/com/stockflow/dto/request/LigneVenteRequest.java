package com.stockflow.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneVenteRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Quantite is required")
    @Min(value = 1, message = "Quantite must be at least 1")
    private Integer quantite;
}
