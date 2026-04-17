package com.stockflow.controller;

import com.stockflow.dto.request.StockMovementRequest;
import com.stockflow.dto.response.ApiResponse;
import com.stockflow.dto.response.StockMovementResponse;
import com.stockflow.service.StockMovementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-movements")
@RequiredArgsConstructor
public class StockMovementController {

    private final StockMovementService stockMovementService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StockMovementResponse>>> getAllMovements() {
        List<StockMovementResponse> movements = stockMovementService.getAllMovements();
        return ResponseEntity.ok(ApiResponse.success(movements));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StockMovementResponse>> getMovementById(@PathVariable Long id) {
        StockMovementResponse movement = stockMovementService.getMovementById(id);
        return ResponseEntity.ok(ApiResponse.success(movement));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<List<StockMovementResponse>>> getMovementsByProduct(
            @PathVariable Long productId) {
        List<StockMovementResponse> movements = stockMovementService.getMovementsByProduct(productId);
        return ResponseEntity.ok(ApiResponse.success(movements));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StockMovementResponse>> createMovement(
            @Valid @RequestBody StockMovementRequest request) {
        StockMovementResponse movement = stockMovementService.createMovement(request);
        return new ResponseEntity<>(
                ApiResponse.success("Stock movement created successfully", movement),
                HttpStatus.CREATED
        );
    }
}
