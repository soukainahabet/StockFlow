package com.stockflow.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Smart Invoice : formal document generated from a {@link Vente}.
 * <p>
 * One vente → one invoice (auto-created at sale time with empty customer info).
 * Customer info is set later via {@code PUT /api/invoices/{id}}.
 */
@Entity
@Table(name = "invoices", indexes = {
        @Index(name = "idx_invoice_number", columnList = "invoice_number", unique = true),
        @Index(name = "idx_invoice_vente", columnList = "vente_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human-readable invoice number, e.g. "INV-2026-00001". Unique. */
    @Column(name = "invoice_number", nullable = false, length = 32, unique = true)
    private String invoiceNumber;

    /** One vente → one invoice. */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vente_id", nullable = false, unique = true)
    private Vente vente;

    @Column(name = "issue_date", nullable = false)
    private LocalDateTime issueDate;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    // ---------- Free-text customer info (optional, edited by user) ----------

    @Column(name = "customer_name", length = 150)
    private String customerName;

    @Column(name = "customer_email", length = 150)
    private String customerEmail;

    @Column(name = "customer_address", length = 500)
    private String customerAddress;

    @Column(name = "customer_phone", length = 30)
    private String customerPhone;

    @Column(name = "notes", length = 500)
    private String notes;
}
