package com.soom.backend.service;


import com.soom.backend.dto.request.CategoryRequest;
import com.soom.backend.dto.response.CategoryResponse;
import com.soom.backend.entity.CategoryEntity;
import com.soom.backend.repository.CategoryRepository;
import com.soom.backend.utils.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoriesRepository;
    private final AuthUtil authUtil;

    public List<CategoryResponse> getAll() {
        return categoriesRepository.findAll()
                .stream()
                .filter(category -> !category.getIsDeleted())
                .map(category -> CategoryResponse.builder()
                        .id(category.getId())
                        .name(category.getName())
                        .type(category.getType())
                        .build())
                .toList();
    }

    public CategoryResponse getById(UUID id) {
        CategoryEntity category = categoriesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kategori tidak ditemukan"));

        if (category.getIsDeleted()) {
            throw new RuntimeException("Kategori tidak ditemukan");
        }

        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .type(category.getType())
                .build();
    }

    public CategoryResponse create(CategoryRequest request) {
        if (categoriesRepository.existsByName(request.getName())) {
            throw new RuntimeException("Nama kategori sudah ada");
        }

        CategoryEntity category = new CategoryEntity();
        category.setName(request.getName());
        category.setType(request.getType());
        category.setCreatedBy(authUtil.getCurrentUserEmail());

        categoriesRepository.save(category);

        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .type(category.getType())
                .build();
    }

    public CategoryResponse update(UUID id, CategoryRequest request) {
        CategoryEntity category = categoriesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kategori tidak ditemukan"));

        if (category.getIsDeleted()) {
            throw new RuntimeException("Kategori tidak ditemukan");
        }

        category.setName(request.getName());
        category.setType(request.getType());
        category.setUpdatedBy(authUtil.getCurrentUserEmail());

        categoriesRepository.save(category);

        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .type(category.getType())
                .build();
    }

    public void delete(UUID id) {
        CategoryEntity category = categoriesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kategori tidak ditemukan"));

        category.setIsDeleted(true);
        category.setUpdatedBy(authUtil.getCurrentUserEmail());
        categoriesRepository.save(category);
    }

}
