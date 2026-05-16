package com.stockflow.controller;

import com.stockflow.dto.response.ApiResponse;
import com.stockflow.dto.response.ProfitSummaryDto;
import com.stockflow.dto.response.TopProductDto;
import com.stockflow.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Business intelligence endpoints (best-sellers, profit).
 * Access is restricted to ADMIN and MANAGER via {@code SecurityConfig}.
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Validated
@Tag(name = "Analytics", description = "Business intelligence: top products, profit aggregation")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/top-products")
    @Operation(summary = "Best-selling products ranked by units sold")
    public ResponseEntity<ApiResponse<List<TopProductDto>>> getTopProducts(
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return ResponseEntity.ok(ApiResponse.success(
                "Top products fetched",
                analyticsService.getTopProducts(limit)
        ));
    }

    @GetMapping("/profit-products")
    @Operation(summary = "Per-product profit ranked DESC + totals (revenue, cost, profit)")
    public ResponseEntity<ApiResponse<ProfitSummaryDto>> getProfitProducts(
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return ResponseEntity.ok(ApiResponse.success(
                "Profit aggregation fetched",
                analyticsService.getProfitByProduct(limit)
        ));
    }
}
