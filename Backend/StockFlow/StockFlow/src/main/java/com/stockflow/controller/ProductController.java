package com.stockflow.controller;

import com.stockflow.dto.request.ProductRequest;
import com.stockflow.dto.response.ApiResponse;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.dto.response.ProductResponse;
import com.stockflow.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Validated
@Tag(name = "Products", description = "Product catalog management")
@SecurityRequirement(name = "bearerAuth")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "List products (paginated + searchable)")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getAllProducts(
            @Parameter(description = "Fuzzy name search") @RequestParam(required = false) String name,
            @Parameter(description = "Filter by category id") @RequestParam(required = false) Long categoryId,
            @Parameter(description = "Minimum price") @RequestParam(required = false) @DecimalMin("0.0") BigDecimal minPrice,
            @Parameter(description = "Maximum price") @RequestParam(required = false) @DecimalMin("0.0") BigDecimal maxPrice,
            @Parameter(description = "Only products with quantity <= alertThreshold") @RequestParam(required = false) Boolean lowStock,
            @ParameterObject @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        PageResponse<ProductResponse> products = productService.search(name, categoryId, minPrice, maxPrice, lowStock, pageable);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a product by id")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        ProductResponse product = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "List products for a given category (paginated)")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getProductsByCategory(
            @PathVariable Long categoryId,
            @ParameterObject @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        PageResponse<ProductResponse> products = productService.getProductsByCategory(categoryId, pageable);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "List products whose quantity is below their alert threshold")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getLowStockProducts() {
        List<ProductResponse> products = productService.getLowStockProducts();
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/by-barcode/{barcode}")
    @Operation(summary = "Lookup a product by its barcode (used by the camera scanner on vente creation)")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductByBarcode(@PathVariable String barcode) {
        ProductResponse product = productService.getProductByBarcode(barcode);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @PostMapping
    @Operation(summary = "Create a product (ADMIN only)")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody ProductRequest request) {
        ProductResponse product = productService.createProduct(request);
        return new ResponseEntity<>(
                ApiResponse.success("Product created successfully", product),
                HttpStatus.CREATED
        );
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a product (ADMIN only)")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        ProductResponse product = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success("Product updated successfully", product));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a product (ADMIN only)")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted successfully", null));
    }
}
