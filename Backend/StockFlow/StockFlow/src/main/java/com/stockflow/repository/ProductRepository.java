package com.stockflow.repository;

import com.stockflow.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByCategoryId(Long categoryId);

    @Query("SELECT p FROM Product p WHERE p.quantity <= p.alertThreshold")
    List<Product> findLowStockProducts();

    @Query("SELECT p FROM Product p WHERE p.quantity <= p.alertThreshold ORDER BY p.quantity ASC")
    List<Product> findLowStockProductsOrderByQuantity();

    boolean existsByName(String name);
}
