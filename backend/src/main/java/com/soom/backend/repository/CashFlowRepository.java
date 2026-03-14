package com.soom.backend.repository;

import com.soom.backend.entity.CashFlowEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CashFlowRepository extends JpaRepository<CashFlowEntity, UUID> {

    List<CashFlowEntity> findByIsDeletedFalseOrderByTransactionDateDesc();
}
