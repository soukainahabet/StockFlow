package com.stockflow.controller;

import com.stockflow.dto.response.ApiResponse;
import com.stockflow.dto.response.UserResponse;
import com.stockflow.security.CustomUserDetails;
import com.stockflow.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Tag(name = "Profile", description = "Current authenticated user")
@SecurityRequirement(name = "bearerAuth")
public class ProfileController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "Get the currently authenticated user (from JWT)")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        UserResponse user = userService.getUserById(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(user));
    }
}
