package com.stockflow.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    /**
     * Optional 1D barcode (EAN-13, UPC, Code-128, ...) or QR payload.
     * Indexed unique to support fast scanning lookups via /api/products/by-barcode/{barcode}.
     */
    @Column(name = "barcode", unique = true, length = 64)
    private String barcode;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    /**
     * Cost / purchase price used for profit computation.
     * Nullable to keep legacy rows valid; new and updated products are required
     * to supply it (validation at DTO level).
     */
    @Column(name = "buy_price", precision = 10, scale = 2)
    private BigDecimal buyPrice;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Integer alertThreshold;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;
}
