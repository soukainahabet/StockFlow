package com.stockflow.dto.response;

import com.stockflow.model.Product;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {
    private Long id;
    private String name;
    private BigDecimal price;
    private Integer quantity;
    private Integer alertThreshold;
    private String categoryName;
    private Long categoryId;
    private boolean lowStock;

    public static ProductResponse fromEntity(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .price(product.getPrice())
                .quantity(product.getQuantity())
                .alertThreshold(product.getAlertThreshold())
                .categoryName(product.getCategory().getName())
                .categoryId(product.getCategory().getId())
                .lowStock(product.getQuantity() <= product.getAlertThreshold())
                .build();
    }
}
