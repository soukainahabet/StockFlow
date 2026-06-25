package com.stockflow.service;

import com.stockflow.dto.request.ProductRequest;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.dto.response.ProductResponse;
import com.stockflow.exception.DuplicateResourceException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.model.Category;
import com.stockflow.model.Product;
import com.stockflow.model.StockMovementType;
import com.stockflow.model.User;
import com.stockflow.repository.CategoryRepository;
import com.stockflow.repository.ProductRepository;
import com.stockflow.repository.UserRepository;
import com.stockflow.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private static final String INITIAL_STOCK_REASON = "Initial stock";

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final StockMovementService stockMovementService;

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

        String barcode = normaliseBarcode(request.getBarcode());
        if (barcode != null && productRepository.existsByBarcode(barcode)) {
            throw new DuplicateResourceException("Product", "barcode", barcode);
        }

        int initialQuantity = request.getQuantity() == null ? 0 : request.getQuantity();

        Product product = Product.builder()
                .name(request.getName())
                .barcode(barcode)
                .price(request.getPrice())
                .buyPrice(request.getBuyPrice())
                .quantity(initialQuantity)
                .alertThreshold(request.getAlertThreshold())
                .category(category)
                .build();

        product = productRepository.save(product);

        if (initialQuantity > 0) {
            stockMovementService.recordInternal(
                    product,
                    StockMovementType.IN,
                    initialQuantity,
                    INITIAL_STOCK_REASON,
                    getCurrentUser()
            );
        }

        return ProductResponse.fromEntity(product);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userDetails.getId()));
    }

    public ProductResponse getProductByBarcode(String barcode) {
        String normalised = normaliseBarcode(barcode);
        if (normalised == null) {
            throw new ResourceNotFoundException("Product", "barcode", barcode);
        }
        return productRepository.findByBarcode(normalised)
                .map(ProductResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "barcode", normalised));
    }

    private static String normaliseBarcode(String raw) {
        if (raw == null) return null;
        String trimmed = raw.trim();
        return trimmed.isEmpty() ? null : trimmed;
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

        String newBarcode = normaliseBarcode(request.getBarcode());
        if (newBarcode != null
                && !newBarcode.equals(product.getBarcode())
                && productRepository.existsByBarcode(newBarcode)) {
            throw new DuplicateResourceException("Product", "barcode", newBarcode);
        }

        product.setName(request.getName());
        product.setBarcode(newBarcode);
        product.setPrice(request.getPrice());
        product.setBuyPrice(request.getBuyPrice());
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
