package com.soom.backend.repository;

import com.soom.backend.entity.OrderEntity;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {
    List<OrderEntity> findByIsDeletedFalseOrderByOrderDateDesc();

    @Query("SELECT o FROM OrderEntity o WHERE o.isDeleted = false AND o.orderDate = :date")
    List<OrderEntity> findByOrderDateAndIsDeletedFalse(@Param("date") LocalDate date);
}
