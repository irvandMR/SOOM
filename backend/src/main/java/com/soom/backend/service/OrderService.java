package com.soom.backend.service;

import com.soom.backend.dto.request.AddPaymentRequest;
import com.soom.backend.dto.request.CreateOrderRequest;
import com.soom.backend.dto.request.OrderItemRequest;
import com.soom.backend.dto.request.UpdateOrderStatusRequest;
import com.soom.backend.dto.response.OrderDetailResponse;
import com.soom.backend.dto.response.OrderItemResponse;
import com.soom.backend.dto.response.OrderPaymentResponse;
import com.soom.backend.dto.response.OrderResponse;
import com.soom.backend.entity.*;
import com.soom.backend.enums.CashFlowType;
import com.soom.backend.enums.OrderStatus;
import com.soom.backend.enums.PaymentStatus;
import com.soom.backend.exception.ResourceNotFoundException;
import com.soom.backend.repository.*;
import com.soom.backend.utils.OrderNumberGenerator;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderPaymentRepository orderPaymentRepository;
    private final ProductRepository productRepository;
    private final OrderNumberGenerator orderNumberGenerator;
    private final CashFlowRepository cashFlowRepository;

    public List<OrderResponse> getAll(){
        return orderRepository.findByIsDeletedFalseOrderByOrderDateDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public OrderDetailResponse getById(UUID id){
        OrderEntity order = findById(id);
        List<OrderItemEntity> items = orderItemRepository.findByOrderIdAndIsDeletedFalse(id);
        List<OrderPaymentEntity> payments = orderPaymentRepository.findByOrderIdAndIsDeletedFalse(id);
        return toDetailResponse(order, items, payments);
    }

    @Transactional
    public OrderDetailResponse create(CreateOrderRequest request){

        // Hitung total amount & buat order items
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItemEntity> items = new ArrayList<>();

        for(OrderItemRequest itemRequest : request.getItems()){
            ProductEntity product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Produk tidak ditemukan"));

            BigDecimal subTotal = product.getDefaultPrice().multiply(itemRequest.getQuantity());
            totalAmount = totalAmount.add(subTotal);

            OrderItemEntity item = new OrderItemEntity();
            item.setProduct(product);
            item.setQuantity(itemRequest.getQuantity());
            item.setUnitPrice(product.getDefaultPrice());
            item.setSubtotal(subTotal);
            item.setNotes(itemRequest.getNotes());
            items.add(item);
        }

        // Buat Order
        OrderEntity order = new OrderEntity();
        order.setOrderNumber(orderNumberGenerator.generate());
        order.setCustomerName(request.getCustomerName());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setCustomerAddress(request.getCustomerAddress());
        order.setOrderDate(request.getOrderDate());
        order.setRequiredDate(request.getRequiredDate());
        order.setStatus(OrderStatus.PENDING);
        order.setTotalAmount(totalAmount);
        order.setPaidAmount(BigDecimal.ZERO);
        order.setPaymentStatus(PaymentStatus.UNPAID);
        order.setNotes(request.getNotes());

        orderRepository.save(order);

        // Simpan items
        items.forEach(item -> item.setOrder(order));
        orderItemRepository.saveAll(items);

        // Proses pembayaran awal jika ada

        List<OrderPaymentEntity> payments = new ArrayList<>();
        if(request.getInitialPayment() != null && request.getInitialPayment().compareTo(BigDecimal.ZERO) > 0){
            OrderPaymentEntity payment = new OrderPaymentEntity();
            payment.setOrder(order);
            payment.setAmount(request.getInitialPayment());
            payment.setPaymentType(request.getPaymentType().name());
            payment.setPaymentDate(request.getOrderDate());
            payment.setNotes("Pembayaran awal");
            orderPaymentRepository.save(payment);
            payments.add(payment);

            // Update paid amount & payment status
            order.setPaidAmount(request.getInitialPayment());
            order.setPaymentStatus(
                    request.getInitialPayment().compareTo(totalAmount) >= 0 ? PaymentStatus.PAID : PaymentStatus.DP
            );
            orderRepository.save(order);

            CashFlowEntity cashFlow = new CashFlowEntity();
            cashFlow.setType(CashFlowType.IN);
            cashFlow.setCategory("Penjualan");
            cashFlow.setAmount(request.getInitialPayment());
            cashFlow.setDescription("Pembayaran order " + order.getOrderNumber());
            cashFlow.setTransactionDate(request.getOrderDate());
            cashFlow.setReferenceType("ORDER");
            cashFlow.setReferenceId(order.getId());
            cashFlowRepository.save(cashFlow);
        }

        return toDetailResponse(order, items, payments);
    }

    @Transactional
    public OrderDetailResponse addPayment(UUID id, AddPaymentRequest request){
        OrderEntity order = findById(id);

        // Simpan payment
        OrderPaymentEntity payment = new OrderPaymentEntity();
        payment.setOrder(order);
        payment.setAmount(request.getAmount());
        payment.setPaymentType(request.getPaymentType().name());
        payment.setPaymentDate(request.getPaymentDate());
        payment.setNotes(request.getNotes());
        orderPaymentRepository.save(payment);

        CashFlowEntity cashFlow = new CashFlowEntity();
        cashFlow.setType(CashFlowType.IN);
        cashFlow.setCategory("Penjualan");
        cashFlow.setAmount(request.getAmount());
        cashFlow.setDescription("Pembayaran order " + order.getOrderNumber());
        cashFlow.setTransactionDate(request.getPaymentDate());
        cashFlow.setReferenceType("ORDER");
        cashFlow.setReferenceId(order.getId());
        cashFlowRepository.save(cashFlow);

        // Update paid amount
        BigDecimal newPaidAmount = order.getPaidAmount().add(request.getAmount());
        order.setPaidAmount(newPaidAmount);

        // Update payment status
        if(newPaidAmount.compareTo(order.getPaidAmount()) >= 0){
            order.setPaymentStatus(PaymentStatus.PAID);
        }else {
            order.setPaymentStatus(PaymentStatus.DP);
        }
        orderRepository.save(order);

        List<OrderItemEntity> items = orderItemRepository.findByOrderIdAndIsDeletedFalse(id);
        List<OrderPaymentEntity> payments =orderPaymentRepository.findByOrderIdAndIsDeletedFalse(id);

        return toDetailResponse(order, items, payments);
    }


    public OrderResponse updateStatus(UUID id, UpdateOrderStatusRequest request){
        OrderEntity order = findById(id);
        order.setStatus(request.getStatus());
        orderRepository.save(order);
        return toResponse(order);
    }
    // ── HELPER ─────────────────────────────────────────

    private OrderEntity findById(UUID id) {
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order tidak ditemukan"));
        if (order.getIsDeleted()) {
            throw new ResourceNotFoundException("Order tidak ditemukan");
        }
        return order;
    }

    private OrderResponse toResponse(OrderEntity order) {
        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .orderDate(order.getOrderDate())
                .requiredDate(order.getRequiredDate())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .paidAmount(order.getPaidAmount())
                .paymentStatus(order.getPaymentStatus())
                .notes(order.getNotes())
                .build();
    }

    private OrderDetailResponse toDetailResponse(OrderEntity order, List<OrderItemEntity> items, List<OrderPaymentEntity> payments) {
        return OrderDetailResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .customerAddress(order.getCustomerAddress())
                .orderDate(order.getOrderDate())
                .requiredDate(order.getRequiredDate())
                .status(order.getStatus().name())
                .totalAmount(order.getTotalAmount())
                .paidAmount(order.getPaidAmount())
                .paymentStatus(order.getPaymentStatus().name())
                .notes(order.getNotes())
                .systemNotes(order.getSystemNotes())
                .items(items.stream()
                        .map(item -> OrderItemResponse.builder()
                                .id(item.getId())
                                .productId(item.getProduct().getId())
                                .productName(item.getProduct().getName())
                                .quantity(item.getQuantity())
                                .unitPrice(item.getUnitPrice())
                                .subtotal(item.getSubtotal())
                                .notes(item.getNotes())
                                .build())
                        .toList())
                .payments(payments.stream()
                        .map(payment -> OrderPaymentResponse.builder()
                                .id(payment.getId())
                                .amount(payment.getAmount())
                                .paymentType(payment.getPaymentType())
                                .paymentDate(payment.getPaymentDate())
                                .notes(payment.getNotes())
                                .build())
                        .toList())
                .build();
    }

}
