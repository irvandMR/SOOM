package com.soom.backend.utils;

import com.soom.backend.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OrderNumberGenerator {
    private final OrderRepository orderRepository;

    public String generate() {
        // Hitung total order yang ada (termasuk deleted)
        long count = orderRepository.count();

        // Format: ORD-001, ORD-002, dst
        return String.format("ORD-%03d", count + 1);
    }
}
