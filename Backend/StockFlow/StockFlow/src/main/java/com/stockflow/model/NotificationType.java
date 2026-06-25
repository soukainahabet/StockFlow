package com.stockflow.model;

/**
 * Domain events surfaced to users via the in-app notification bell.
 * Distinct constants keep the frontend free to map each type to its own icon/colour.
 */
public enum NotificationType {
    /** A SELLER closed a sale — sent to STOCK_MANAGER for the resulting stock exit. */
    STOCK_EXIT,
    /** A new sale has been recorded — sent to MANAGER (and ADMIN for supervision). */
    NEW_SALE,
    /** A product's stock dropped to/under its alert threshold. */
    LOW_STOCK
}
