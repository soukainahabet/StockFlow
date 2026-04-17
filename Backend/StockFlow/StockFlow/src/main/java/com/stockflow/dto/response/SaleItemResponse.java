package com.stockflow.dto.response;

import com.stockflow.model.SaleItem;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleItemResponse {
    private Long id;
    private String productName;
    private Long productId;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal subtotal;

    public static SaleItemResponse fromEntity(SaleItem item) {
        return SaleItemResponse.builder()
                .id(item.getId())
                .productName(item.getProduct().getName())
                .productId(item.getProduct().getId())
                .quantity(item.getQuantity())
                .price(item.getPrice())
                .subtotal(item.getSubtotal())
                .build();
    }
}
