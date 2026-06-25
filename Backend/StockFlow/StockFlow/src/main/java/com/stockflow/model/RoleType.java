package com.stockflow.model;

/**
 * Distinguishes built-in roles whose names back the {@code SecurityConfig} RBAC matrix
 * from operator-defined roles created from the admin UI.
 *
 * <ul>
 *   <li>{@link #SYSTEM} – reserved, immutable, non-deletable, seeded on startup.</li>
 *   <li>{@link #CUSTOM} – created by ADMIN, mutable, deletable, no automatic permissions.</li>
 * </ul>
 */
public enum RoleType {
    SYSTEM,
    CUSTOM
}
