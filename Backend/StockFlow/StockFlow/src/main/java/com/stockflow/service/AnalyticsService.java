package com.stockflow.service;

import com.stockflow.dto.response.ProfitProductDto;
import com.stockflow.dto.response.ProfitSummaryDto;
import com.stockflow.dto.response.TopProductDto;
import com.stockflow.repository.LigneVenteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Read-only analytics aggregations.
 * <p>
 * Profit caveat: cost is computed using the <em>current</em> {@code Product.buyPrice}
 * rather than a historical snapshot — sale lines do not store the buy price at
 * sale time. Acceptable for trend analysis; if accountancy-grade accuracy is
 * needed later, add a {@code buyPrice} column on {@code LigneVente}.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private final LigneVenteRepository ligneVenteRepository;

    private static final int DEFAULT_LIMIT = 10;
    private static final int MAX_LIMIT = 100;

    public List<TopProductDto> getTopProducts(int limit) {
        int capped = clamp(limit);
        return ligneVenteRepository.findTopProductsWithStats(PageRequest.of(0, capped)).stream()
                .map(row -> TopProductDto.builder()
                        .productId(asLong(row[0]))
                        .productName(asString(row[1]))
                        .categoryName(asString(row[2]))
                        .quantitySold(asLong(row[3]))
                        .salesCount(asLong(row[4]))
                        .revenue(asBigDecimal(row[5]))
                        .build())
                .toList();
    }

    public ProfitSummaryDto getProfitByProduct(int limit) {
        // Always run the full aggregation, then slice — totals reflect the
        // whole catalogue regardless of the requested top-N.
        List<Object[]> rows = ligneVenteRepository.findProfitByProduct(
                PageRequest.of(0, MAX_LIMIT));

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;
        long totalQty = 0L;

        for (Object[] row : rows) {
            BigDecimal revenue = asBigDecimal(row[6]);
            BigDecimal cost = asBigDecimal(row[7]);
            Long qty = asLong(row[5]);
            totalRevenue = totalRevenue.add(revenue);
            totalCost = totalCost.add(cost);
            totalQty += qty;
        }
        BigDecimal totalProfit = totalRevenue.subtract(totalCost);
        BigDecimal overallMargin = computeMargin(totalProfit, totalRevenue);

        int capped = clamp(limit);
        List<ProfitProductDto> items = rows.stream()
                .limit(capped)
                .map(row -> {
                    BigDecimal revenue = asBigDecimal(row[6]);
                    BigDecimal cost = asBigDecimal(row[7]);
                    BigDecimal profit = revenue.subtract(cost);
                    return ProfitProductDto.builder()
                            .productId(asLong(row[0]))
                            .productName(asString(row[1]))
                            .categoryName(asString(row[2]))
                            .buyPrice(asBigDecimal(row[3]))
                            .sellPrice(asBigDecimal(row[4]))
                            .quantitySold(asLong(row[5]))
                            .revenue(revenue)
                            .cost(cost)
                            .profit(profit)
                            .marginPercent(computeMargin(profit, revenue))
                            .build();
                })
                .toList();

        return ProfitSummaryDto.builder()
                .totalRevenue(totalRevenue)
                .totalCost(totalCost)
                .totalProfit(totalProfit)
                .totalQuantitySold(totalQty)
                .productCount(rows.size())
                .overallMarginPercent(overallMargin)
                .items(items)
                .build();
    }

    // ---------- helpers ----------

    private static int clamp(int limit) {
        if (limit <= 0) return DEFAULT_LIMIT;
        return Math.min(limit, MAX_LIMIT);
    }

    private static BigDecimal computeMargin(BigDecimal profit, BigDecimal revenue) {
        if (revenue == null || revenue.signum() == 0) return null;
        return profit.multiply(BigDecimal.valueOf(100))
                .divide(revenue, 2, RoundingMode.HALF_UP);
    }

    private static Long asLong(Object o) {
        if (o == null) return 0L;
        if (o instanceof Number n) return n.longValue();
        return Long.parseLong(o.toString());
    }

    private static BigDecimal asBigDecimal(Object o) {
        if (o == null) return BigDecimal.ZERO;
        if (o instanceof BigDecimal bd) return bd;
        if (o instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return new BigDecimal(o.toString());
    }

    private static String asString(Object o) {
        return o == null ? null : o.toString();
    }
}
