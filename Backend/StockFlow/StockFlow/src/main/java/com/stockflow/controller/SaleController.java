package com.stockflow.controller;

import com.stockflow.dto.request.SaleRequest;
import com.stockflow.dto.response.ApiResponse;
import com.stockflow.dto.response.SaleResponse;
import com.stockflow.service.SaleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SaleResponse>>> getAllSales() {
        List<SaleResponse> sales = saleService.getAllSales();
        return ResponseEntity.ok(ApiResponse.success(sales));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SaleResponse>> getSaleById(@PathVariable Long id) {
        SaleResponse sale = saleService.getSaleById(id);
        return ResponseEntity.ok(ApiResponse.success(sale));
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<SaleResponse>>> getRecentSales(
            @RequestParam(defaultValue = "10") int limit) {
        List<SaleResponse> sales = saleService.getRecentSales(limit);
        return ResponseEntity.ok(ApiResponse.success(sales));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SaleResponse>> createSale(
            @Valid @RequestBody SaleRequest request) {
        SaleResponse sale = saleService.createSale(request);
        return new ResponseEntity<>(
                ApiResponse.success("Sale created successfully", sale),
                HttpStatus.CREATED
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSale(@PathVariable Long id) {
        saleService.deleteSale(id);
        return ResponseEntity.ok(ApiResponse.success("Sale deleted successfully", null));
    }
}
