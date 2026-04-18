package com.stockflow.controller;

import com.stockflow.dto.request.LoginRequest;
import com.stockflow.dto.request.RegisterRequest;
import com.stockflow.dto.response.ApiResponse;
import com.stockflow.dto.response.AuthResponse;
import com.stockflow.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Public endpoints for registration and login (no JWT required)")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user (returns a JWT token)")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return new ResponseEntity<>(
                ApiResponse.success("User registered successfully", response),
                HttpStatus.CREATED
        );
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate with email/password, returns a JWT token valid 24h")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }
}
