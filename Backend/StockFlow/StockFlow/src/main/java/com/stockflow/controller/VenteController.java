package com.stockflow.controller;

import com.stockflow.dto.request.VenteRequest;
import com.stockflow.dto.response.ApiResponse;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.dto.response.VenteResponse;
import com.stockflow.service.VenteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/ventes")
@RequiredArgsConstructor
@Validated
@Tag(name = "Ventes", description = "Sales transactions (single consolidated module)")
@SecurityRequirement(name = "bearerAuth")
public class VenteController {

    private final VenteService venteService;

    @GetMapping
    @Operation(summary = "List ventes (paginated + filters)")
    public ResponseEntity<ApiResponse<PageResponse<VenteResponse>>> getAllVentes(
            @Parameter(description = "Filter by user id") @RequestParam(required = false) Long userId,
            @Parameter(description = "Start date (ISO-8601)") @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @Parameter(description = "End date (ISO-8601)") @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @Parameter(description = "Minimum total") @RequestParam(required = false) @DecimalMin("0.0") BigDecimal minTotal,
            @Parameter(description = "Maximum total") @RequestParam(required = false) @DecimalMin("0.0") BigDecimal maxTotal,
            @ParameterObject @PageableDefault(size = 20, sort = "date", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<VenteResponse> ventes = venteService.search(userId, startDate, endDate, minTotal, maxTotal, pageable);
        return ResponseEntity.ok(ApiResponse.success(ventes));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a vente by id (with lignes)")
    public ResponseEntity<ApiResponse<VenteResponse>> getVenteById(@PathVariable Long id) {
        VenteResponse vente = venteService.getVenteById(id);
        return ResponseEntity.ok(ApiResponse.success(vente));
    }

    @GetMapping("/recent")
    @Operation(summary = "Get the most recent ventes (1..100)")
    public ResponseEntity<ApiResponse<List<VenteResponse>>> getRecentVentes(
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int limit) {
        return ResponseEntity.ok(ApiResponse.success(venteService.getRecentVentes(limit)));
    }

    @PostMapping
    @Operation(summary = "Create a new vente (auto-decrements stock + creates OUT movements)")
    public ResponseEntity<ApiResponse<VenteResponse>> createVente(
            @Valid @RequestBody VenteRequest request) {
        VenteResponse vente = venteService.createVente(request);
        return new ResponseEntity<>(
                ApiResponse.success("Vente created successfully", vente),
                HttpStatus.CREATED
        );
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a vente (ADMIN only)")
    public ResponseEntity<ApiResponse<Void>> deleteVente(@PathVariable Long id) {
        venteService.deleteVente(id);
        return ResponseEntity.ok(ApiResponse.success("Vente deleted successfully", null));
    }
}
