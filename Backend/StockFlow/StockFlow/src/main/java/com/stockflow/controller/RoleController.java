package com.stockflow.controller;

import com.stockflow.dto.request.RoleRequest;
import com.stockflow.dto.response.ApiResponse;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.dto.response.RoleResponse;
import com.stockflow.model.RoleType;
import com.stockflow.service.RoleService;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Roles", description = "Role catalog management (ADMIN only)")
@SecurityRequirement(name = "bearerAuth")
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    @Operation(summary = "List roles (paginated). Optional filters by type and active status.")
    public ResponseEntity<ApiResponse<PageResponse<RoleResponse>>> getAllRoles(
            @Parameter(description = "Filter by role type") @RequestParam(required = false) RoleType type,
            @Parameter(description = "Filter by active flag") @RequestParam(required = false) Boolean active,
            @ParameterObject @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(roleService.getAllRoles(type, active, pageable)));
    }

    @GetMapping("/assignable")
    @Operation(summary = "List roles eligible for user assignment: all SYSTEM roles + active CUSTOM roles.")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getAssignableRoles() {
        return ResponseEntity.ok(ApiResponse.success(roleService.listAssignable()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a role by id")
    public ResponseEntity<ApiResponse<RoleResponse>> getRoleById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(roleService.getRoleById(id)));
    }

    @PostMapping
    @Operation(summary = "Create a CUSTOM role. System role names are rejected; permissions start empty.")
    public ResponseEntity<ApiResponse<RoleResponse>> createRole(@Valid @RequestBody RoleRequest request) {
        RoleResponse role = roleService.createRole(request);
        return new ResponseEntity<>(
                ApiResponse.success("Role created successfully", role),
                HttpStatus.CREATED
        );
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a CUSTOM role (name / active / permissions). SYSTEM roles are immutable.")
    public ResponseEntity<ApiResponse<RoleResponse>> updateRole(@PathVariable Long id,
                                                                @Valid @RequestBody RoleRequest request) {
        RoleResponse role = roleService.updateRole(id, request);
        return ResponseEntity.ok(ApiResponse.success("Role updated successfully", role));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a CUSTOM role (rejects if still assigned to users). SYSTEM roles cannot be deleted.")
    public ResponseEntity<ApiResponse<Void>> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return ResponseEntity.ok(ApiResponse.success("Role deleted successfully", null));
    }
}
