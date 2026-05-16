package com.stockflow.repository;

import com.stockflow.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    @EntityGraph(attributePaths = "category")
    @Override
    Page<Product> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "category")
    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);

    List<Product> findByCategoryId(Long categoryId);

    @Query("SELECT p FROM Product p WHERE p.quantity <= p.alertThreshold")
    @EntityGraph(attributePaths = "category")
    List<Product> findLowStockProducts();

    @Query("SELECT p FROM Product p WHERE p.quantity <= p.alertThreshold ORDER BY p.quantity ASC")
    @EntityGraph(attributePaths = "category")
    List<Product> findLowStockProductsOrderByQuantity();

    @Query("""
            SELECT p FROM Product p
            WHERE (:name IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%')))
              AND (:categoryId IS NULL OR p.category.id = :categoryId)
              AND (:minPrice IS NULL OR p.price >= :minPrice)
              AND (:maxPrice IS NULL OR p.price <= :maxPrice)
              AND (:lowStock IS NULL
                   OR (:lowStock = TRUE AND p.quantity <= p.alertThreshold)
                   OR (:lowStock = FALSE AND p.quantity > p.alertThreshold))
            """)
    @EntityGraph(attributePaths = "category")
    Page<Product> search(@Param("name") String name,
                         @Param("categoryId") Long categoryId,
                         @Param("minPrice") BigDecimal minPrice,
                         @Param("maxPrice") BigDecimal maxPrice,
                         @Param("lowStock") Boolean lowStock,
                         Pageable pageable);

    boolean existsByName(String name);

    @EntityGraph(attributePaths = "category")
    java.util.Optional<Product> findByBarcode(String barcode);

    boolean existsByBarcode(String barcode);
}
