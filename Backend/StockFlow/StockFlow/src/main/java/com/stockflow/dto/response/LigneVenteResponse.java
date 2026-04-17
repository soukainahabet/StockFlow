package com.stockflow.dto.response;

import com.stockflow.model.LigneVente;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneVenteResponse {
    private Long id;
    private Long productId;
    private String productName;
    private Integer quantite;
    private BigDecimal prixUnitaire;
    private BigDecimal sousTotal;

    public static LigneVenteResponse fromEntity(LigneVente ligne) {
        return LigneVenteResponse.builder()
                .id(ligne.getId())
                .productId(ligne.getProduct().getId())
                .productName(ligne.getProduct().getName())
                .quantite(ligne.getQuantite())
                .prixUnitaire(ligne.getPrixUnitaire())
                .sousTotal(ligne.getSousTotal())
                .build();
    }
}
