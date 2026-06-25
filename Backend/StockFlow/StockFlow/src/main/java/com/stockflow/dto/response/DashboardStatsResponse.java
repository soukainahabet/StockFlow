package com.stockflow.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Compact KPI bundle for the home dashboard cards.
 * Computed in a single backend call to avoid frontend fanning out to
 * multiple endpoints. Revenue windows are rolling (last N days from now),
 * not calendar-month based.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Dashboard KPIs: rolling revenue windows + low-stock summary")
public class DashboardStatsResponse {

    @Schema(description = "Sum of sale totals created since 00:00 today.")
    private BigDecimal todayRevenue;

    @Schema(description = "Sum of sale totals over the last 7 days (rolling window).")
    private BigDecimal last7DaysRevenue;

    @Schema(description = "Sum of sale totals over the last 30 days (rolling window).")
    private BigDecimal last30DaysRevenue;

    @Schema(description = "Number of products whose quantity is at or below their alert threshold.")
    private long lowStockCount;

    @Schema(description = "List of low-stock products, ordered by remaining quantity ASC.")
    private List<ProductResponse> lowStockProducts;
}
