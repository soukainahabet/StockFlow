package com.stockflow.repository;

import com.stockflow.model.Vente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VenteRepository extends JpaRepository<Vente, Long> {

    @EntityGraph(attributePaths = {"user", "lignes", "lignes.product"})
    @Override
    Optional<Vente> findById(Long id);

    @EntityGraph(attributePaths = "user")
    @Override
    Page<Vente> findAll(Pageable pageable);

    List<Vente> findByUserId(Long userId);

    List<Vente> findByDateBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT v FROM Vente v ORDER BY v.date DESC")
    @EntityGraph(attributePaths = "user")
    List<Vente> findRecentVentes(Pageable pageable);

    @Query("SELECT v FROM Vente v WHERE v.user.id = :userId ORDER BY v.date DESC")
    @EntityGraph(attributePaths = "user")
    List<Vente> findRecentVentesByUser(@Param("userId") Long userId, Pageable pageable);

    @Query("""
            SELECT v FROM Vente v
            WHERE (:userId IS NULL OR v.user.id = :userId)
              AND (:startDate IS NULL OR v.date >= :startDate)
              AND (:endDate IS NULL OR v.date <= :endDate)
              AND (:minTotal IS NULL OR v.total >= :minTotal)
              AND (:maxTotal IS NULL OR v.total <= :maxTotal)
            """)
    @EntityGraph(attributePaths = "user")
    Page<Vente> search(@Param("userId") Long userId,
                       @Param("startDate") LocalDateTime startDate,
                       @Param("endDate") LocalDateTime endDate,
                       @Param("minTotal") BigDecimal minTotal,
                       @Param("maxTotal") BigDecimal maxTotal,
                       Pageable pageable);

    @Query("SELECT COALESCE(SUM(v.total), 0) FROM Vente v")
    BigDecimal getTotalVentes();

    @Query("SELECT COALESCE(SUM(v.total), 0) FROM Vente v WHERE v.date >= :startDate")
    BigDecimal getTotalVentesSince(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT COALESCE(SUM(v.total), 0) FROM Vente v WHERE v.date BETWEEN :startDate AND :endDate")
    BigDecimal getTotalVentesBetween(@Param("startDate") LocalDateTime startDate,
                                     @Param("endDate") LocalDateTime endDate);
}
