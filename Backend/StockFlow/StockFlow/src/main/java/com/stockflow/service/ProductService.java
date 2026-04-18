package com.stockflow.service;

import com.stockflow.dto.request.ProductRequest;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.dto.response.ProductResponse;
import com.stockflow.exception.DuplicateResourceException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.model.Category;
import com.stockflow.model.Product;
import com.stockflow.repository.CategoryRepository;
import com.stockflow.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public PageResponse<ProductResponse> getAllProducts(Pageable pageable) {
        Page<Product> page = productRepository.findAll(pageable);
        return PageResponse.from(page, ProductResponse::fromEntity);
    }

    public PageResponse<ProductResponse> search(String name,
                                                Long categoryId,
                                                BigDecimal minPrice,
                                                BigDecimal maxPrice,
                                                Boolean lowStock,
                                                Pageable pageable) {
        Page<Product> page = productRepository.search(name, categoryId, minPrice, maxPrice, lowStock, pageable);
        return PageResponse.from(page, ProductResponse::fromEntity);
    }

    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return ProductResponse.fromEntity(product);
    }

    public PageResponse<ProductResponse> getProductsByCategory(Long categoryId, Pageable pageable) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new ResourceNotFoundException("Category", "id", categoryId);
        }
        Page<Product> page = productRepository.findByCategoryId(categoryId, pageable);
        return PageResponse.from(page, ProductResponse::fromEntity);
    }

    public List<ProductResponse> getLowStockProducts() {
        return productRepository.findLowStockProductsOrderByQuantity().stream()
                .map(ProductResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        if (productRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Product", "name", request.getName());
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        Product product = Product.builder()
                .name(request.getName())
                .price(request.getPrice())
                .quantity(request.getQuantity())
                .alertThreshold(request.getAlertThreshold())
                .category(category)
                .build();

        product = productRepository.save(product);
        return ProductResponse.fromEntity(product);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        if (!product.getName().equals(request.getName())
                && productRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Product", "name", request.getName());
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        product.setName(request.getName());
        product.setPrice(request.getPrice());
        product.setQuantity(request.getQuantity());
        product.setAlertThreshold(request.getAlertThreshold());
        product.setCategory(category);

        product = productRepository.save(product);
        return ProductResponse.fromEntity(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product", "id", id);
        }
        productRepository.deleteById(id);
    }

    @Transactional
    public void updateProductQuantity(Long productId, int quantityChange) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        product.setQuantity(product.getQuantity() + quantityChange);
        productRepository.save(product);
    }
}
