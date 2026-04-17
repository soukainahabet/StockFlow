package com.stockflow.repository;

import com.stockflow.model.SaleItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {

    List<SaleItem> findBySaleId(Long saleId);

    List<SaleItem> findByProductId(Long productId);

    @Query("SELECT si.product.id, si.product.name, SUM(si.quantity) as totalQty " +
           "FROM SaleItem si " +
           "GROUP BY si.product.id, si.product.name " +
           "ORDER BY totalQty DESC")
    List<Object[]> findTopSellingProducts(Pageable pageable);
}
