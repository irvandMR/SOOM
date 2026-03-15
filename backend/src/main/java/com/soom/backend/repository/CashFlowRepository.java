package com.soom.backend.repository;

import com.soom.backend.entity.CashFlowEntity;
import com.soom.backend.enums.CashFlowType;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface CashFlowRepository extends JpaRepository<CashFlowEntity, UUID> {

    List<CashFlowEntity> findByIsDeletedFalseOrderByTransactionDateDesc();

    @Query("SELECT c FROM CashFlowEntity c WHERE c.isDeleted = false AND c.transactionDate = :date AND c.type = :type")
    List<CashFlowEntity> findByTransactionDateAndType(@Param("date") LocalDate date, @Param("type") CashFlowType type);
}
