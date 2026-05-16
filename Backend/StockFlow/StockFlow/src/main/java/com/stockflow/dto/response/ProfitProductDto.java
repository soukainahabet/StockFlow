package com.stockflow.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Per-product profit row: profit = revenue - cost, where cost uses the current buyPrice")
public class ProfitProductDto {

    @Schema(example = "42")
    private Long productId;

    @Schema(example = "Vis M5 inox")
    private String productName;

    @Schema(example = "Quincaillerie")
    private String categoryName;

    @Schema(example = "0.80", description = "Current buy / cost price (may be null on legacy rows; treated as 0 in cost computation)")
    private BigDecimal buyPrice;

    @Schema(example = "1.50", description = "Current sell price")
    private BigDecimal sellPrice;

    @Schema(example = "1240")
    private Long quantitySold;

    @Schema(example = "1860.00", description = "SUM(quantity * line.prixUnitaire)")
    private BigDecimal revenue;

    @Schema(example = "992.00", description = "SUM(quantity * product.buyPrice)")
    private BigDecimal cost;

    @Schema(example = "868.00", description = "revenue - cost")
    private BigDecimal profit;

    @Schema(example = "46.67", description = "100 * profit / revenue (null when revenue = 0)")
    private BigDecimal marginPercent;
}
