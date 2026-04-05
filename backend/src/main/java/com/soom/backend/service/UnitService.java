package com.soom.backend.service;

import com.soom.backend.dto.request.UnitRequest;
import com.soom.backend.dto.response.PageResponse;
import com.soom.backend.dto.response.UnitResponse;
import com.soom.backend.entity.UnitsEntity;
import com.soom.backend.repository.UnitRepository;
import com.soom.backend.utils.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UnitService {

    private final UnitRepository unitRepository;
    private final AuthUtil authUtil;

    public PageResponse<UnitResponse> getAll(Pageable pageable, String search) {
        String searchParam = (search != null && !search.isEmpty()) ? "%" + search.toLowerCase() + "%" : null;
        Page<UnitsEntity> page = unitRepository.findAllActive(searchParam, pageable);
        return PageResponse.of(page.map(this::toResponse));
    }

    // GET BY ID
    public UnitResponse getById(UUID id) {
        UnitsEntity unit = unitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Unit tidak ditemukan"));

        if (unit.getIsDeleted()) {
            throw new RuntimeException("Unit tidak ditemukan");
        }

        return toResponse(unit);
    }

    // CREATE
    public UnitResponse create(UnitRequest request) {
        if (unitRepository.existsByName(request.getName())) {
            throw new RuntimeException("Nama unit sudah ada");
        }

        UnitsEntity unit = new UnitsEntity();
        unit.setName(request.getName());
        unit.setSymbol(request.getSymbol());
        unit.setCreatedBy(authUtil.getCurrentUserEmail());

        unitRepository.save(unit);

        return toResponse(unit);
    }

    // UPDATE
    public UnitResponse update(UUID id, UnitRequest request) {
        UnitsEntity unit = unitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Unit tidak ditemukan"));

        if (unit.getIsDeleted()) {
            throw new RuntimeException("Unit tidak ditemukan");
        }

        unit.setName(request.getName());
        unit.setSymbol(request.getSymbol());
        unit.setUpdatedBy(authUtil.getCurrentUserEmail());

        unitRepository.save(unit);

        return toResponse(unit);
    }

    // DELETE (soft delete)
    public void delete(UUID id) {
        UnitsEntity unit = unitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Unit tidak ditemukan"));

        unit.setIsDeleted(true);
        unit.setUpdatedBy(authUtil.getCurrentUserEmail());
        unitRepository.save(unit);
    }

    private UnitResponse toResponse(UnitsEntity unit) {
        return UnitResponse.builder()
                .id(unit.getId())
                .name(unit.getName())
                .symbol(unit.getSymbol())
                .conversionFactor(unit.getConversionFactor())
                .baseUnit(unit.getBaseUnit())
                .build();
    }
}
