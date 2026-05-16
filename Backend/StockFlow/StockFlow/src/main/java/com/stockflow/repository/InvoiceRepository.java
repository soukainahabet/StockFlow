package com.stockflow.repository;

import com.stockflow.model.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    @EntityGraph(attributePaths = {"vente", "vente.user", "vente.lignes", "vente.lignes.product"})
    @Override
    Optional<Invoice> findById(Long id);

    @EntityGraph(attributePaths = {"vente", "vente.user"})
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    Optional<Invoice> findByVenteId(Long venteId);

    long countByInvoiceNumberStartingWith(String prefix);

    @Query("""
            SELECT i FROM Invoice i
            WHERE (:search IS NULL
                   OR LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(COALESCE(i.customerName, '')) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:startDate IS NULL OR i.issueDate >= :startDate)
              AND (:endDate IS NULL OR i.issueDate <= :endDate)
            """)
    @EntityGraph(attributePaths = {"vente", "vente.user"})
    Page<Invoice> search(@Param("search") String search,
                         @Param("startDate") LocalDateTime startDate,
                         @Param("endDate") LocalDateTime endDate,
                         Pageable pageable);
}
