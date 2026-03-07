package com.soom.backend.service;

import com.soom.backend.dto.request.UnitRequest;
import com.soom.backend.dto.response.UnitResponse;
import com.soom.backend.entity.UnitsEntity;
import com.soom.backend.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UnitService {

    private final UnitRepository unitRepository;

    // GET ALL
    public List<UnitResponse> getAll() {
        return unitRepository.findAll()
                .stream()
                .filter(unit -> !unit.getIsDeleted())
                .map(unit -> UnitResponse.builder()
                        .id(unit.getId())
                        .name(unit.getName())
                        .symbol(unit.getSymbol())
                        .build())
                .collect(Collectors.toList());
    }

    // GET BY ID
    public UnitResponse getById(UUID id) {
        UnitsEntity unit = unitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Unit tidak ditemukan"));

        if (unit.getIsDeleted()) {
            throw new RuntimeException("Unit tidak ditemukan");
        }

        return UnitResponse.builder()
                .id(unit.getId())
                .name(unit.getName())
                .symbol(unit.getSymbol())
                .build();
    }

    // CREATE
    public UnitResponse create(UnitRequest request) {
        if (unitRepository.existsByName(request.getName())) {
            throw new RuntimeException("Nama unit sudah ada");
        }

        UnitsEntity unit = new UnitsEntity();
        unit.setName(request.getName());
        unit.setSymbol(request.getSymbol());

        unitRepository.save(unit);

        return UnitResponse.builder()
                .id(unit.getId())
                .name(unit.getName())
                .symbol(unit.getSymbol())
                .build();
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

        unitRepository.save(unit);

        return UnitResponse.builder()
                .id(unit.getId())
                .name(unit.getName())
                .symbol(unit.getSymbol())
                .build();
    }

    // DELETE (soft delete)
    public void delete(UUID id) {
        UnitsEntity unit = unitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Unit tidak ditemukan"));

        unit.setIsDeleted(true);
        unitRepository.save(unit);
    }
}
