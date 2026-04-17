package com.stockflow.service;

import com.stockflow.dto.response.ProductResponse;
import com.stockflow.dto.response.SaleResponse;
import com.stockflow.repository.ProductRepository;
import com.stockflow.repository.SaleItemRepository;
import com.stockflow.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final SaleItemRepository saleItemRepository;

    public Map<String, Object> getTotalSales() {
        Map<String, Object> result = new HashMap<>();

        BigDecimal totalAll = saleRepository.getTotalSales();
        result.put("totalAllTime", totalAll != null ? totalAll : BigDecimal.ZERO);

        // Today's sales
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        BigDecimal totalToday = saleRepository.getTotalSalesSince(startOfDay);
        result.put("totalToday", totalToday != null ? totalToday : BigDecimal.ZERO);

        // This week's sales
        LocalDateTime startOfWeek = LocalDateTime.now().minusDays(7);
        BigDecimal totalWeek = saleRepository.getTotalSalesSince(startOfWeek);
        result.put("totalThisWeek", totalWeek != null ? totalWeek : BigDecimal.ZERO);

        // This month's sales
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        BigDecimal totalMonth = saleRepository.getTotalSalesSince(startOfMonth);
        result.put("totalThisMonth", totalMonth != null ? totalMonth : BigDecimal.ZERO);

        // Total number of sales
        result.put("totalTransactions", saleRepository.count());

        return result;
    }

    public List<ProductResponse> getLowStockProducts() {
        return productRepository.findLowStockProductsOrderByQuantity().stream()
                .map(ProductResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getTopProducts(int limit) {
        List<Object[]> topProducts = saleItemRepository.findTopSellingProducts(PageRequest.of(0, limit));

        return topProducts.stream()
                .map(row -> {
                    Map<String, Object> product = new HashMap<>();
                    product.put("productId", row[0]);
                    product.put("productName", row[1]);
                    product.put("totalQuantitySold", row[2]);
                    return product;
                })
                .collect(Collectors.toList());
    }

    public List<SaleResponse> getRecentSales(int limit) {
        return saleRepository.findRecentSales(PageRequest.of(0, limit)).stream()
                .map(SaleResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getDashboardSummary() {
        Map<String, Object> summary = new HashMap<>();

        summary.put("sales", getTotalSales());
        summary.put("lowStockCount", productRepository.findLowStockProducts().size());
        summary.put("totalProducts", productRepository.count());
        summary.put("topProducts", getTopProducts(5));
        summary.put("recentSales", getRecentSales(5));

        return summary;
    }
}
