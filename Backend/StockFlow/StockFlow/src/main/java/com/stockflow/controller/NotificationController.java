package com.stockflow.controller;

import com.stockflow.dto.response.ApiResponse;
import com.stockflow.dto.response.NotificationResponse;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notification inbox for the authenticated user")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "List notifications for the current user (most recent first)")
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> list(
            @ParameterObject @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.listForCurrentUser(pageable)));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Number of unread notifications for the current user")
    public ResponseEntity<ApiResponse<Map<String, Long>>> unreadCount() {
        long count = notificationService.unreadCountForCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "Mark a single notification as read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markRead(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.markRead(id)));
    }

    @PostMapping("/read-all")
    @Operation(summary = "Mark every notification of the current user as read")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> markAllRead() {
        int updated = notificationService.markAllRead();
        return ResponseEntity.ok(ApiResponse.success(Map.of("updated", updated)));
    }
}
