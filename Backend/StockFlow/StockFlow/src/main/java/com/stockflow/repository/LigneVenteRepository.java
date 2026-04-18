package com.stockflow.repository;

import com.stockflow.model.LigneVente;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LigneVenteRepository extends JpaRepository<LigneVente, Long> {

    List<LigneVente> findByVenteId(Long venteId);

    List<LigneVente> findByProductId(Long productId);

    @Query("""
            SELECT l.product.id, l.product.name, SUM(l.quantite) AS totalQty
              FROM LigneVente l
             GROUP BY l.product.id, l.product.name
             ORDER BY totalQty DESC
            """)
    List<Object[]> findTopSellingProducts(Pageable pageable);
}
