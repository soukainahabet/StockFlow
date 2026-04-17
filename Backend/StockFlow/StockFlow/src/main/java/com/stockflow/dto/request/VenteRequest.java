package com.stockflow.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VenteRequest {

    @NotEmpty(message = "Vente must have at least one ligne")
    @Valid
    private List<LigneVenteRequest> lignes;
}
