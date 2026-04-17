package com.stockflow.repository;

import com.stockflow.model.Sale;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    List<Sale> findByUserId(Long userId);

    List<Sale> findByDateBetween(LocalDateTime start, LocalDateTime end);

    List<Sale> findAllByOrderByDateDesc();

    @Query("SELECT s FROM Sale s ORDER BY s.date DESC")
    List<Sale> findRecentSales(Pageable pageable);

    @Query("SELECT SUM(s.total) FROM Sale s")
    BigDecimal getTotalSales();

    @Query("SELECT SUM(s.total) FROM Sale s WHERE s.date >= :startDate")
    BigDecimal getTotalSalesSince(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT SUM(s.total) FROM Sale s WHERE s.date BETWEEN :startDate AND :endDate")
    BigDecimal getTotalSalesBetween(@Param("startDate") LocalDateTime startDate,
                                    @Param("endDate") LocalDateTime endDate);
}
