package com.stockflow.repository;

import com.stockflow.model.StockMovement;
import com.stockflow.model.StockMovementType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    List<StockMovement> findByProductId(Long productId);

    List<StockMovement> findByUserId(Long userId);

    List<StockMovement> findByType(StockMovementType type);

    List<StockMovement> findByDateBetween(LocalDateTime start, LocalDateTime end);

    List<StockMovement> findAllByOrderByDateDesc();
}
