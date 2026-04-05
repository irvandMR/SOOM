package com.soom.backend.service;

import com.soom.backend.context.TenantContext;
import com.soom.backend.dto.request.CategoryRequest;
import com.soom.backend.dto.response.CategoryResponse;
import com.soom.backend.dto.response.PageResponse;
import com.soom.backend.entity.CategoryEntity;
import com.soom.backend.repository.CategoryRepository;
import com.soom.backend.repository.TenantRepository;
import com.soom.backend.utils.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoriesRepository;
    private final AuthUtil authUtil;
    private final TenantRepository tenantRepository;

    public PageResponse<CategoryResponse> getAll(Pageable pageable, String search) {
        UUID tenantId = TenantContext.getTenantId();
        String searchParam = (search != null && !search.isEmpty()) ? "%" + search.toLowerCase() + "%" : null;
        Page<CategoryEntity> page = categoriesRepository.findAllActive(tenantId, searchParam, pageable);
        return PageResponse.of(page.map(this::toResponse));
    }

    public CategoryResponse getById(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        CategoryEntity category = categoriesRepository.findByIdAndTenantId(id, tenantId)
                .filter(c -> !c.getIsDeleted())
                .orElseThrow(() -> new RuntimeException("Kategori tidak ditemukan"));

        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .type(category.getType())
                .build();
    }

    public CategoryResponse create(CategoryRequest request) {
        UUID tenantId = TenantContext.getTenantId();

        if (categoriesRepository.existsByNameAndTenantId(request.getName(), tenantId)) {
            throw new RuntimeException("Nama kategori sudah ada");
        }

        CategoryEntity category = new CategoryEntity();
        category.setName(request.getName());
        category.setType(request.getType());
        category.setCreatedBy(authUtil.getCurrentUserEmail());
        category.setTenant(tenantRepository.getReferenceById(tenantId));

        categoriesRepository.save(category);

        return toResponse(category);
    }

    public CategoryResponse update(UUID id, CategoryRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        CategoryEntity category = categoriesRepository.findByIdAndTenantId(id, tenantId)
                .filter(c -> !c.getIsDeleted())
                .orElseThrow(() -> new RuntimeException("Kategori tidak ditemukan"));

        category.setName(request.getName());
        category.setType(request.getType());
        category.setUpdatedBy(authUtil.getCurrentUserEmail());

        categoriesRepository.save(category);

        return toResponse(category);
    }

    public void delete(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        CategoryEntity category = categoriesRepository.findByIdAndTenantId(id, tenantId)
                .filter(c -> !c.getIsDeleted())
                .orElseThrow(() -> new RuntimeException("Kategori tidak ditemukan"));

        category.setIsDeleted(true);
        category.setUpdatedBy(authUtil.getCurrentUserEmail());
        categoriesRepository.save(category);
    }

    private CategoryResponse toResponse(CategoryEntity category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .type(category.getType())
                .build();
    }
}