package com.stockflow.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Atomic, named capability that can be granted to a {@link Role}.
 * Permissions are seeded by {@code DataInitializer} and surfaced to the UI via
 * {@code GET /api/permissions}. Users inherit them transitively through their role
 * (see {@code CustomUserDetails#getAuthorities()}).
 */
@Entity
@Table(name = "permissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Canonical key stored on the role (e.g. {@code PRODUCT_WRITE}). */
    @Column(unique = true, nullable = false, length = 64)
    private String code;

    /** Human-readable label shown in the admin UI. */
    @Column(nullable = false, length = 128)
    private String label;

    /** Grouping label used to organise the permissions picker (e.g. {@code Produits}). */
    @Column(nullable = false, length = 64)
    private String category;
}
