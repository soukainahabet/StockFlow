package com.stockflow.service;

import com.stockflow.dto.request.SaleItemRequest;
import com.stockflow.dto.request.SaleRequest;
import com.stockflow.dto.response.SaleResponse;
import com.stockflow.exception.InsufficientStockException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.model.*;
import com.stockflow.repository.ProductRepository;
import com.stockflow.repository.SaleRepository;
import com.stockflow.repository.StockMovementRepository;
import com.stockflow.repository.UserRepository;
import com.stockflow.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockMovementRepository stockMovementRepository;

    public List<SaleResponse> getAllSales() {
        return saleRepository.findAllByOrderByDateDesc().stream()
                .map(SaleResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public SaleResponse getSaleById(Long id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale", "id", id));
        return SaleResponse.fromEntity(sale);
    }

    public List<SaleResponse> getRecentSales(int limit) {
        return saleRepository.findRecentSales(PageRequest.of(0, limit)).stream()
                .map(SaleResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public SaleResponse createSale(SaleRequest request) {
        User currentUser = getCurrentUser();

        // Create sale
        Sale sale = Sale.builder()
                .date(LocalDateTime.now())
                .total(BigDecimal.ZERO)
                .user(currentUser)
                .build();

        BigDecimal total = BigDecimal.ZERO;

        // Process each item
        for (SaleItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemRequest.getProductId()));

            // Check stock availability
            if (product.getQuantity() < itemRequest.getQuantity()) {
                throw new InsufficientStockException(
                        product.getName(),
                        product.getQuantity(),
                        itemRequest.getQuantity()
                );
            }

            // Create sale item
            SaleItem saleItem = SaleItem.builder()
                    .product(product)
                    .quantity(itemRequest.getQuantity())
                    .price(product.getPrice())
                    .build();

            sale.addItem(saleItem);

            // Calculate subtotal
            BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
            total = total.add(subtotal);

            // Reduce product quantity
            product.setQuantity(product.getQuantity() - itemRequest.getQuantity());
            productRepository.save(product);

            // Log stock movement
            StockMovement movement = StockMovement.builder()
                    .type(StockMovementType.OUT)
                    .quantity(itemRequest.getQuantity())
                    .date(LocalDateTime.now())
                    .product(product)
                    .user(currentUser)
                    .build();
            stockMovementRepository.save(movement);
        }

        sale.setTotal(total);
        sale = saleRepository.save(sale);

        return SaleResponse.fromEntity(sale);
    }

    @Transactional
    public void deleteSale(Long id) {
        if (!saleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Sale", "id", id);
        }
        saleRepository.deleteById(id);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userDetails.getId()));
    }
}
