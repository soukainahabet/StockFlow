package com.stockflow.controller;

import com.stockflow.dto.request.StockMovementRequest;
import com.stockflow.dto.response.ApiResponse;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.dto.response.StockMovementResponse;
import com.stockflow.model.StockMovementType;
import com.stockflow.service.StockMovementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/stock-movements")
@RequiredArgsConstructor
@Tag(name = "Stock Movements", description = "Stock IN/OUT movements tracking")
@SecurityRequirement(name = "bearerAuth")
public class StockMovementController {

    private final StockMovementService stockMovementService;

    @GetMapping
    @Operation(summary = "List stock movements (paginated + filters)")
    public ResponseEntity<ApiResponse<PageResponse<StockMovementResponse>>> getAllMovements(
            @Parameter(description = "Filter by product id") @RequestParam(required = false) Long productId,
            @Parameter(description = "Filter by user id") @RequestParam(required = false) Long userId,
            @Parameter(description = "IN or OUT") @RequestParam(required = false) StockMovementType type,
            @Parameter(description = "Start date (ISO-8601)") @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @Parameter(description = "End date (ISO-8601)") @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @ParameterObject @PageableDefault(size = 20, sort = "date", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<StockMovementResponse> movements =
                stockMovementService.search(productId, userId, type, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.success(movements));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a stock movement by id")
    public ResponseEntity<ApiResponse<StockMovementResponse>> getMovementById(@PathVariable Long id) {
        StockMovementResponse movement = stockMovementService.getMovementById(id);
        return ResponseEntity.ok(ApiResponse.success(movement));
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "List movements for a given product (paginated)")
    public ResponseEntity<ApiResponse<PageResponse<StockMovementResponse>>> getMovementsByProduct(
            @PathVariable Long productId,
            @ParameterObject @PageableDefault(size = 20, sort = "date", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<StockMovementResponse> movements = stockMovementService.getMovementsByProduct(productId, pageable);
        return ResponseEntity.ok(ApiResponse.success(movements));
    }

    @PostMapping
    @Operation(summary = "Create a stock movement (IN increases stock, OUT decreases)")
    public ResponseEntity<ApiResponse<StockMovementResponse>> createMovement(
            @Valid @RequestBody StockMovementRequest request) {
        StockMovementResponse movement = stockMovementService.createMovement(request);
        return new ResponseEntity<>(
                ApiResponse.success("Stock movement created successfully", movement),
                HttpStatus.CREATED
        );
    }
}
