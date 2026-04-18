package com.stockflow.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Payload to create a new vente")
public class VenteRequest {

    @Schema(description = "Lignes de vente")
    @NotEmpty(message = "Vente must have at least one ligne")
    @Size(max = 500, message = "A vente cannot contain more than 500 lignes")
    @Valid
    private List<LigneVenteRequest> lignes;
}
