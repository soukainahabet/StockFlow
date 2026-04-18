package com.stockflow.repository;

import com.stockflow.model.StockMovement;
import com.stockflow.model.StockMovementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    @EntityGraph(attributePaths = {"product", "product.category", "user"})
    @Override
    Page<StockMovement> findAll(Pageable pageable);

    List<StockMovement> findByProductId(Long productId);

    @EntityGraph(attributePaths = {"product", "product.category", "user"})
    Page<StockMovement> findByProductId(Long productId, Pageable pageable);

    List<StockMovement> findByUserId(Long userId);

    List<StockMovement> findByType(StockMovementType type);

    List<StockMovement> findByDateBetween(LocalDateTime start, LocalDateTime end);

    List<StockMovement> findAllByOrderByDateDesc();

    @Query("""
            SELECT m FROM StockMovement m
            WHERE (:productId IS NULL OR m.product.id = :productId)
              AND (:userId IS NULL OR m.user.id = :userId)
              AND (:type IS NULL OR m.type = :type)
              AND (:startDate IS NULL OR m.date >= :startDate)
              AND (:endDate IS NULL OR m.date <= :endDate)
            """)
    @EntityGraph(attributePaths = {"product", "product.category", "user"})
    Page<StockMovement> search(@Param("productId") Long productId,
                               @Param("userId") Long userId,
                               @Param("type") StockMovementType type,
                               @Param("startDate") LocalDateTime startDate,
                               @Param("endDate") LocalDateTime endDate,
                               Pageable pageable);
}
