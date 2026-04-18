package com.stockflow.controller;

import com.stockflow.dto.response.ApiResponse;
import com.stockflow.dto.response.ProductResponse;
import com.stockflow.dto.response.VenteResponse;
import com.stockflow.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Validated
@Tag(name = "Dashboard", description = "Aggregated KPIs and analytics (ADMIN, STOCK_MANAGER, SELLER, MANAGER)")
@SecurityRequirement(name = "bearerAuth")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/total-ventes")
    @Operation(summary = "Sales totals: today / week / month / all time + transaction count")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTotalVentes() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getTotalVentes()));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Products below their alert threshold")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getLowStockProducts() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getLowStockProducts()));
    }

    @GetMapping("/top-products")
    @Operation(summary = "Best-selling products (by total quantity sold)")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopProducts(
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int limit) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getTopProducts(limit)));
    }

    @GetMapping("/recent-ventes")
    @Operation(summary = "Most recent ventes")
    public ResponseEntity<ApiResponse<List<VenteResponse>>> getRecentVentes(
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int limit) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getRecentVentes(limit)));
    }

    @GetMapping("/summary")
    @Operation(summary = "Full dashboard summary (totals + low-stock count + top products + recent ventes)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardSummary() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getDashboardSummary()));
    }
}
