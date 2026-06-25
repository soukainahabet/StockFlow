package com.stockflow.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications", indexes = {
        // Column name is {@code is_read}: {@code read} is a reserved word in MySQL.
        @Index(name = "idx_notif_recipient_read", columnList = "recipient_id, is_read"),
        @Index(name = "idx_notif_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private NotificationType type;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    /** Optional deep-link (e.g. {@code /ventes/42} or {@code /products/7}). */
    @Column(name = "link_url", length = 200)
    private String linkUrl;

    // Java field name stays {@code read}; the column is {@code is_read} because
    // {@code READ} is a reserved word in MySQL and would break the generated DDL.
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean read = false;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
