package com.stockflow.dto.response;

import com.stockflow.model.Vente;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VenteResponse {
    private Long id;
    private LocalDateTime date;
    private BigDecimal total;
    private Long userId;
    private String userName;
    private List<LigneVenteResponse> lignes;

    public static VenteResponse fromEntity(Vente vente) {
        return VenteResponse.builder()
                .id(vente.getId())
                .date(vente.getDate())
                .total(vente.getTotal())
                .userId(vente.getUser().getId())
                .userName(vente.getUser().getName())
                .lignes(vente.getLignes().stream()
                        .map(LigneVenteResponse::fromEntity)
                        .collect(Collectors.toList()))
                .build();
    }
}
