package com.stockflow.controller;

import com.stockflow.dto.response.ApiResponse;
import com.stockflow.dto.response.ProductResponse;
import com.stockflow.dto.response.SaleResponse;
import com.stockflow.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/total-sales")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTotalSales() {
        Map<String, Object> sales = dashboardService.getTotalSales();
        return ResponseEntity.ok(ApiResponse.success(sales));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getLowStockProducts() {
        List<ProductResponse> products = dashboardService.getLowStockProducts();
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/top-products")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopProducts(
            @RequestParam(defaultValue = "10") int limit) {
        List<Map<String, Object>> products = dashboardService.getTopProducts(limit);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/recent-sales")
    public ResponseEntity<ApiResponse<List<SaleResponse>>> getRecentSales(
            @RequestParam(defaultValue = "10") int limit) {
        List<SaleResponse> sales = dashboardService.getRecentSales(limit);
        return ResponseEntity.ok(ApiResponse.success(sales));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardSummary() {
        Map<String, Object> summary = dashboardService.getDashboardSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
