package com.stockflow.controller;

import com.stockflow.dto.response.ApiResponse;
import com.stockflow.dto.response.PermissionResponse;
import com.stockflow.service.PermissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Permissions", description = "Permission catalog (ADMIN only)")
@SecurityRequirement(name = "bearerAuth")
public class PermissionController {

    private final PermissionService permissionService;

    @GetMapping
    @Operation(summary = "List all available permissions grouped by category.")
    public ResponseEntity<ApiResponse<List<PermissionResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(permissionService.listAll()));
    }
}
