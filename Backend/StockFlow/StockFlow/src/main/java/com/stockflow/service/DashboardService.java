package com.stockflow.service;

import com.stockflow.dto.response.DashboardStatsResponse;
import com.stockflow.dto.response.ProductResponse;
import com.stockflow.dto.response.VenteResponse;
import com.stockflow.model.Product;
import com.stockflow.repository.LigneVenteRepository;
import com.stockflow.repository.ProductRepository;
import com.stockflow.repository.VenteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final VenteRepository venteRepository;
    private final LigneVenteRepository ligneVenteRepository;
    private final ProductRepository productRepository;

    /**
     * Single-shot KPI bundle for the home dashboard.
     * Revenue windows are rolling from {@code now} — {@code last30DaysRevenue} is
     * {@code [now-30d, now]}, NOT the calendar month-to-date.
     */
    public DashboardStatsResponse getStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime sevenDaysAgo = now.minusDays(7);
        LocalDateTime thirtyDaysAgo = now.minusDays(30);

        List<Product> lowStock = productRepository.findLowStockProductsOrderByQuantity();
        List<ProductResponse> lowStockDtos = lowStock.stream()
                .map(ProductResponse::fromEntity)
                .toList();

        return DashboardStatsResponse.builder()
                .todayRevenue(zeroIfNull(venteRepository.getTotalVentesSince(startOfDay)))
                .last7DaysRevenue(zeroIfNull(venteRepository.getTotalVentesSince(sevenDaysAgo)))
                .last30DaysRevenue(zeroIfNull(venteRepository.getTotalVentesSince(thirtyDaysAgo)))
                .lowStockCount(lowStock.size())
                .lowStockProducts(lowStockDtos)
                .build();
    }

    public Map<String, Object> getTotalVentes() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime startOfWeek = now.minusDays(7);
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atTime(LocalTime.MIN);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalAllTime", zeroIfNull(venteRepository.getTotalVentes()));
        result.put("totalToday", zeroIfNull(venteRepository.getTotalVentesSince(startOfDay)));
        result.put("totalThisWeek", zeroIfNull(venteRepository.getTotalVentesSince(startOfWeek)));
        result.put("totalThisMonth", zeroIfNull(venteRepository.getTotalVentesSince(startOfMonth)));
        result.put("totalTransactions", venteRepository.count());
        return result;
    }

    public List<ProductResponse> getLowStockProducts() {
        return productRepository.findLowStockProductsOrderByQuantity().stream()
                .map(ProductResponse::fromEntity)
                .toList();
    }

    public List<Map<String, Object>> getTopProducts(int limit) {
        return ligneVenteRepository.findTopSellingProducts(PageRequest.of(0, limit)).stream()
                .map(row -> {
                    Map<String, Object> product = new LinkedHashMap<>();
                    product.put("productId", row[0]);
                    product.put("productName", row[1]);
                    product.put("totalQuantitySold", row[2]);
                    return product;
                })
                .toList();
    }

    public List<VenteResponse> getRecentVentes(int limit) {
        return venteRepository.findRecentVentes(PageRequest.of(0, limit)).stream()
                .map(VenteResponse::fromEntity)
                .toList();
    }

    public Map<String, Object> getDashboardSummary() {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("ventes", getTotalVentes());
        summary.put("lowStockCount", productRepository.findLowStockProducts().size());
        summary.put("totalProducts", productRepository.count());
        summary.put("topProducts", getTopProducts(5));
        summary.put("recentVentes", getRecentVentes(5));
        return summary;
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
