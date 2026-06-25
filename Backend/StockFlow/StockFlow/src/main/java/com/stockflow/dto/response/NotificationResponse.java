package com.stockflow.dto.response;

import com.stockflow.model.Notification;
import com.stockflow.model.NotificationType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "User-facing notification")
public class NotificationResponse {

    private Long id;
    private NotificationType type;
    private String title;
    private String message;
    private String linkUrl;
    private boolean read;
    private LocalDateTime createdAt;

    public static NotificationResponse fromEntity(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .linkUrl(notification.getLinkUrl())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
