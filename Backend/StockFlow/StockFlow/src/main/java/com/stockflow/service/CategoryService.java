package com.stockflow.service;

import com.stockflow.dto.request.CategoryRequest;
import com.stockflow.dto.response.CategoryResponse;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.exception.DuplicateResourceException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.model.Category;
import com.stockflow.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public PageResponse<CategoryResponse> getAllCategories(String name, Pageable pageable) {
        Page<Category> page = (name == null || name.isBlank())
                ? categoryRepository.findAll(pageable)
                : categoryRepository.findByNameContainingIgnoreCase(name.trim(), pageable);
        return PageResponse.from(page, CategoryResponse::fromEntity);
    }

    public CategoryResponse getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        return CategoryResponse.fromEntity(category);
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Category", "name", request.getName());
        }

        Category category = Category.builder()
                .name(request.getName())
                .build();

        category = categoryRepository.save(category);
        return CategoryResponse.fromEntity(category);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        if (!category.getName().equals(request.getName()) &&
            categoryRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Category", "name", request.getName());
        }

        category.setName(request.getName());
        category = categoryRepository.save(category);
        return CategoryResponse.fromEntity(category);
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category", "id", id);
        }
        categoryRepository.deleteById(id);
    }
}
