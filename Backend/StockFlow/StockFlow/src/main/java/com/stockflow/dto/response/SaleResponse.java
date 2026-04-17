package com.stockflow.dto.response;

import com.stockflow.model.Sale;
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
public class SaleResponse {
    private Long id;
    private LocalDateTime date;
    private BigDecimal total;
    private String userName;
    private Long userId;
    private List<SaleItemResponse> items;

    public static SaleResponse fromEntity(Sale sale) {
        return SaleResponse.builder()
                .id(sale.getId())
                .date(sale.getDate())
                .total(sale.getTotal())
                .userName(sale.getUser().getName())
                .userId(sale.getUser().getId())
                .items(sale.getItems().stream()
                        .map(SaleItemResponse::fromEntity)
                        .collect(Collectors.toList()))
                .build();
    }
}
