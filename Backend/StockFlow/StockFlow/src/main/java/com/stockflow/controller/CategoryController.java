package com.stockflow.controller;

import com.stockflow.dto.request.CategoryRequest;
import com.stockflow.dto.response.ApiResponse;
import com.stockflow.dto.response.CategoryResponse;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.service.CategoryService;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Product categories management")
@SecurityRequirement(name = "bearerAuth")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "List categories (paginated + searchable)")
    public ResponseEntity<ApiResponse<PageResponse<CategoryResponse>>> getAllCategories(
            @Parameter(description = "Fuzzy name search") @RequestParam(required = false) String name,
            @ParameterObject @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        PageResponse<CategoryResponse> categories = categoryService.getAllCategories(name, pageable);
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a category by id")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryById(@PathVariable Long id) {
        CategoryResponse category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    @PostMapping
    @Operation(summary = "Create a category (ADMIN only)")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CategoryRequest request) {
        CategoryResponse category = categoryService.createCategory(request);
        return new ResponseEntity<>(
                ApiResponse.success("Category created successfully", category),
                HttpStatus.CREATED
        );
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a category (ADMIN only)")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        CategoryResponse category = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success("Category updated successfully", category));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a category (ADMIN only)")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Category deleted successfully", null));
    }
}
