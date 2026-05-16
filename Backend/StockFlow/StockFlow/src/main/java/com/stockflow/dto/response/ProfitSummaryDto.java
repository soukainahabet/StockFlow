package com.stockflow.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Profit aggregation: totals + per-product breakdown")
public class ProfitSummaryDto {

    @Schema(example = "45000.00")
    private BigDecimal totalRevenue;

    @Schema(example = "32549.50")
    private BigDecimal totalCost;

    @Schema(example = "12450.50", description = "Sum of (revenue - cost) across all products")
    private BigDecimal totalProfit;

    @Schema(example = "1542", description = "Total units sold across all products")
    private Long totalQuantitySold;

    @Schema(example = "24", description = "Number of distinct products with at least one sale")
    private Integer productCount;

    @Schema(example = "27.67", description = "100 * totalProfit / totalRevenue (null when totalRevenue = 0)")
    private BigDecimal overallMarginPercent;

    private List<ProfitProductDto> items;
}
