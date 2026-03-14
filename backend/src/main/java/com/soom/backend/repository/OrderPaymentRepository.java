package com.soom.backend.repository;

import com.soom.backend.entity.OrderPaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderPaymentRepository extends JpaRepository<OrderPaymentEntity, UUID> {
    List<OrderPaymentEntity> findByOrderIdAndIsDeletedFalse(UUID orderId);
}
