package com.stockflow.dto.response;

import com.stockflow.model.Product;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Product representation returned to clients")
public class ProductResponse {

    @Schema(example = "42")
    private Long id;

    @Schema(example = "Coca-Cola 33cl")
    private String name;

    @Schema(example = "5449000000996", description = "Barcode (EAN-13, UPC, Code-128, QR payload) — null if not set")
    private String barcode;

    @Schema(example = "1.50", description = "Unit sell price")
    private BigDecimal price;

    @Schema(example = "0.80", description = "Purchase / cost price (null on legacy rows)")
    private BigDecimal buyPrice;

    @Schema(example = "100")
    private Integer quantity;

    @Schema(example = "10")
    private Integer alertThreshold;

    @Schema(example = "Beverages")
    private String categoryName;

    @Schema(example = "1")
    private Long categoryId;

    @Schema(description = "True when quantity <= alertThreshold", example = "false")
    private boolean lowStock;

    public static ProductResponse fromEntity(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .barcode(product.getBarcode())
                .price(product.getPrice())
                .buyPrice(product.getBuyPrice())
                .quantity(product.getQuantity())
                .alertThreshold(product.getAlertThreshold())
                .categoryName(product.getCategory().getName())
                .categoryId(product.getCategory().getId())
                .lowStock(product.getQuantity() <= product.getAlertThreshold())
                .build();
    }
}
