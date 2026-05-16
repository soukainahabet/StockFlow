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

    /**
     * Top-selling products with full analytics row.
     * Columns: [0]=productId, [1]=productName, [2]=categoryName,
     *          [3]=quantitySold, [4]=salesCount, [5]=revenue
     * Single GROUP BY → no N+1 (one statement covers everything).
     */
    @Query("""
            SELECT l.product.id,
                   l.product.name,
                   l.product.category.name,
                   SUM(l.quantite),
                   COUNT(DISTINCT l.vente.id),
                   SUM(l.quantite * l.prixUnitaire)
              FROM LigneVente l
             GROUP BY l.product.id, l.product.name, l.product.category.name
             ORDER BY SUM(l.quantite) DESC
            """)
    List<Object[]> findTopProductsWithStats(Pageable pageable);

    /**
     * Per-product profit aggregation.
     * Columns: [0]=productId, [1]=productName, [2]=categoryName,
     *          [3]=buyPrice (may be null), [4]=sellPrice,
     *          [5]=quantitySold, [6]=revenue, [7]=cost
     * Cost uses COALESCE(buyPrice, 0) to keep legacy rows safe.
     * Profit and margin are derived in the service layer.
     */
    @Query("""
            SELECT l.product.id,
                   l.product.name,
                   l.product.category.name,
                   l.product.buyPrice,
                   l.product.price,
                   SUM(l.quantite),
                   SUM(l.quantite * l.prixUnitaire),
                   SUM(l.quantite * COALESCE(l.product.buyPrice, 0))
              FROM LigneVente l
             GROUP BY l.product.id, l.product.name, l.product.category.name,
                      l.product.buyPrice, l.product.price
             ORDER BY (SUM(l.quantite * l.prixUnitaire)
                       - SUM(l.quantite * COALESCE(l.product.buyPrice, 0))) DESC
            """)
    List<Object[]> findProfitByProduct(Pageable pageable);
}
