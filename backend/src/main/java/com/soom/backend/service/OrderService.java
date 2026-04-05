package com.soom.backend.service;

import com.soom.backend.context.TenantContext;
import com.soom.backend.dto.request.AddPaymentRequest;
import com.soom.backend.dto.request.CreateOrderRequest;
import com.soom.backend.dto.request.OrderItemRequest;
import com.soom.backend.dto.request.UpdateOrderStatusRequest;
import com.soom.backend.dto.response.*;
import com.soom.backend.entity.*;
import com.soom.backend.enums.*;
import com.soom.backend.exception.ResourceNotFoundException;
import com.soom.backend.repository.*;
import com.soom.backend.utils.OrderNumberGenerator;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
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
    private final ProductionRepository productionRepository;
    private final ProductRecipeRepository recipeRepository;
    private final ProductRecipeItemRepository recipeItemRepository;
    private final IngredientRepository ingredientRepository;
    private final IngredientStockHistoryRepository stockHistoryRepository;
    private final OrderNumberGenerator orderNumberGenerator;
    private final CashFlowRepository cashFlowRepository;
    private final TenantRepository tenantRepository;

    public PageResponse<OrderResponse> getAll(
            Pageable pageable, 
            String search,
            String statusStr,
            String paymentStatusStr) {
        
        UUID tenantId = TenantContext.getTenantId();
        
        OrderStatus status = null;
        if (statusStr != null && !statusStr.equals("ALL")) {
            try { status = OrderStatus.valueOf(statusStr); } catch (Exception ignored) {}
        }

        PaymentStatus paymentStatus = null;
        if (paymentStatusStr != null && !paymentStatusStr.equals("ALL")) {
            try { paymentStatus = PaymentStatus.valueOf(paymentStatusStr); } catch (Exception ignored) {}
        }

        String searchParam = (search != null && !search.isEmpty()) ? "%" + search.toLowerCase() + "%" : null;
        Page<OrderEntity> page = orderRepository.findAllActive(tenantId, searchParam, status, paymentStatus, pageable);
        return PageResponse.of(page.map(this::toResponse));
    }

    public OrderDetailResponse getById(UUID id) {
        OrderEntity order = findById(id);
        List<OrderItemEntity> items = orderItemRepository.findByOrderIdAndIsDeletedFalse(id);
        List<OrderPaymentEntity> payments = orderPaymentRepository.findByOrderIdAndIsDeletedFalse(id);
        return toDetailResponse(order, items, payments);
    }

    @Transactional
    public OrderDetailResponse create(CreateOrderRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        TenantEntity tenant = tenantRepository.getReferenceById(tenantId);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItemEntity> items = new ArrayList<>();
        StringBuilder systemNotes = new StringBuilder();

        for (OrderItemRequest itemRequest : request.getItems()) {
            ProductEntity product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Produk tidak ditemukan"));

            // Wajib pilih produksi
            if (itemRequest.getProductionId() == null) {
                throw new RuntimeException("Produksi wajib dipilih untuk produk: " + product.getName());
            }

            ProductionEntity production = productionRepository.findById(itemRequest.getProductionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Produksi tidak ditemukan"));

            // Cek available qty produksi
            BigDecimal available = production.getAvailableQty() != null
                    ? production.getAvailableQty()
                    : BigDecimal.ZERO;

            if (available.compareTo(itemRequest.getQuantity()) < 0) {
                systemNotes.append("⚠️ Stok produksi ")
                        .append(product.getName())
                        .append(" tidak cukup. Tersedia: ")
                        .append(available)
                        .append(", dibutuhkan: ")
                        .append(itemRequest.getQuantity())
                        .append(". ");
            }

            // Harga dari request FE, fallback ke rekomendasi
            BigDecimal unitPrice = itemRequest.getUnitPrice() != null
                    ? itemRequest.getUnitPrice()
                    : calculateRecommendedPrice(production);

            BigDecimal subTotal = unitPrice.multiply(itemRequest.getQuantity());
            totalAmount = totalAmount.add(subTotal);

            OrderItemEntity item = new OrderItemEntity();
            item.setProduct(product);
            item.setProduction(production);
            item.setQuantity(itemRequest.getQuantity());
            item.setUnitPrice(unitPrice);           // ← pakai unitPrice yang sudah benar
            item.setSubtotal(subTotal);             // ← pakai subTotal yang sudah benar
            item.setNotes(itemRequest.getNotes());
            items.add(item);

            // Update stok produk & produksi untuk SEMUA tipe produk
            BigDecimal itemQty = itemRequest.getQuantity();
            production.setAvailableQty(available.subtract(itemQty));
            productionRepository.save(production);

            // Kurangi stok produk utama agar sinkron dengan daftar inventory
            product.setStockQuantity(product.getStockQuantity().subtract(itemQty));
            productRepository.save(product);
        }

        // Buat order
        OrderEntity order = new OrderEntity();
        order.setTenant(tenant);
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
        order.setSystemNotes(systemNotes.length() > 0 ? systemNotes.toString() : null);
        orderRepository.save(order);

        // Simpan items
        items.forEach(item -> item.setOrder(order));
        orderItemRepository.saveAll(items);

        // Proses pembayaran awal
        List<OrderPaymentEntity> payments = new ArrayList<>();
        if (request.getInitialPayment() != null
                && request.getInitialPayment().compareTo(BigDecimal.ZERO) > 0) {

            OrderPaymentEntity payment = new OrderPaymentEntity();
            payment.setOrder(order);
            payment.setAmount(request.getInitialPayment());
            payment.setPaymentType(request.getPaymentType().name());
            payment.setPaymentDate(request.getOrderDate());
            payment.setNotes("Pembayaran awal");
            orderPaymentRepository.save(payment);
            payments.add(payment);

            order.setPaidAmount(request.getInitialPayment());
            order.setPaymentStatus(
                    request.getInitialPayment().compareTo(totalAmount) >= 0
                            ? PaymentStatus.PAID : PaymentStatus.DP
            );
            orderRepository.save(order);

            // Cash flow
            CashFlowEntity cashFlow = new CashFlowEntity();
            cashFlow.setTenant(tenant);
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
    public OrderResponse updateStatus(UUID id, UpdateOrderStatusRequest request) {
        OrderEntity order = findById(id);
        OrderStatus oldStatus = order.getStatus();
        order.setStatus(request.getStatus());
        orderRepository.save(order);

        // Saat order DONE → kurangi stok bahan untuk MADE_TO_ORDER & Catat COGS
        if (request.getStatus() == OrderStatus.DONE && oldStatus != OrderStatus.DONE) {
            List<OrderItemEntity> items = orderItemRepository.findByOrderIdAndIsDeletedFalse(id);
            BigDecimal totalOrderCogs = BigDecimal.ZERO;

            for (OrderItemEntity item : items) {
                ProductEntity product = item.getProduct();
                if (item.getProduction() == null) continue;

                // Snapshot COGS dari produksi
                BigDecimal unitCogs = item.getProduction().getActualCostPerUnit();
                BigDecimal itemTotalCogs = item.getQuantity().multiply(unitCogs);
                
                item.setCogsPerUnit(unitCogs);
                item.setTotalCogs(itemTotalCogs);
                orderItemRepository.save(item);
                
                totalOrderCogs = totalOrderCogs.add(itemTotalCogs);

                // Logic Pengurangan Stok Bahan Ganda sudah dihapus. 
                // Bahan baku kini hanya dipotong di modul PRODUKSI.
            }

            // Catat CashFlow OUT untuk HPP (COGS)
            if (totalOrderCogs.compareTo(BigDecimal.ZERO) > 0) {
                CashFlowEntity hppFlow = new CashFlowEntity();
                hppFlow.setTenant(order.getTenant());
                hppFlow.setType(CashFlowType.OUT);
                hppFlow.setCategory("HPP");
                hppFlow.setAmount(totalOrderCogs);
                hppFlow.setDescription("HPP Order " + order.getOrderNumber());
                hppFlow.setTransactionDate(LocalDate.now());
                hppFlow.setReferenceType("ORDER_HPP");
                hppFlow.setReferenceId(order.getId());
                cashFlowRepository.save(hppFlow);
            }
        }

        // Saat order CANCELLED → kembalikan availableQty produksi
        if (request.getStatus() == OrderStatus.CANCELLED && oldStatus != OrderStatus.CANCELLED) {
            List<OrderItemEntity> items = orderItemRepository.findByOrderIdAndIsDeletedFalse(id);

            for (OrderItemEntity item : items) {
                try {
                    if (item.getProduction() != null) {
                        ProductionEntity production = item.getProduction();
                        BigDecimal currentAvailable = production.getAvailableQty() != null
                                ? production.getAvailableQty() : BigDecimal.ZERO;

                        production.setAvailableQty(currentAvailable.add(item.getQuantity()));
                        productionRepository.save(production);
                    }

                    // Kembalikan stok produk untuk MADE_TO_STOCK
                    if (item.getProduct() != null && item.getProduct().getType() == ProductType.MADE_TO_STOCK) {
                        ProductEntity product = item.getProduct();
                        product.setStockQuantity(product.getStockQuantity().add(item.getQuantity()));
                        productRepository.save(product);
                    }
                } catch (Exception e) {
                    // Ignore orphaned references (e.g. hard deleted products) during order cancellation
                }
            }
        }

        return toResponse(order);
    }

    @Transactional
    public OrderDetailResponse addPayment(UUID id, AddPaymentRequest request) {
        OrderEntity order = findById(id);

        OrderPaymentEntity payment = new OrderPaymentEntity();
        payment.setOrder(order);
        payment.setAmount(request.getAmount());
        payment.setPaymentType(request.getPaymentType().name());
        payment.setPaymentDate(request.getPaymentDate());
        payment.setNotes(request.getNotes());
        orderPaymentRepository.save(payment);

        CashFlowEntity cashFlow = new CashFlowEntity();
        cashFlow.setTenant(order.getTenant());
        cashFlow.setType(CashFlowType.IN);
        cashFlow.setCategory("Penjualan");
        cashFlow.setAmount(request.getAmount());
        cashFlow.setDescription("Pembayaran order " + order.getOrderNumber());
        cashFlow.setTransactionDate(request.getPaymentDate());
        cashFlow.setReferenceType("ORDER");
        cashFlow.setReferenceId(order.getId());
        cashFlowRepository.save(cashFlow);

        BigDecimal newPaidAmount = order.getPaidAmount().add(request.getAmount());
        order.setPaidAmount(newPaidAmount);
        order.setPaymentStatus(
                newPaidAmount.compareTo(order.getTotalAmount()) >= 0
                        ? PaymentStatus.PAID : PaymentStatus.DP
        );
        orderRepository.save(order);

        List<OrderItemEntity> items = orderItemRepository.findByOrderIdAndIsDeletedFalse(id);
        List<OrderPaymentEntity> payments = orderPaymentRepository.findByOrderIdAndIsDeletedFalse(id);
        return toDetailResponse(order, items, payments);
    }

    // ── HELPER ─────────────────────────────────────────

    private BigDecimal calculateRecommendedPrice(ProductionEntity production) {
        List<ProductRecipeItemEntity> items =
                recipeItemRepository.findByRecipesIdAndTenantIdAndIsDeletedFalse(
                        production.getRecipes().getId(), TenantContext.getTenantId()
                );

        BigDecimal totalCostPerBatch = items.stream()
                .map(i -> i.getQuantity().multiply(i.getIngredients().getAvgPurchasePrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCost = totalCostPerBatch.multiply(production.getQuantityProduced());

        BigDecimal yieldQty = production.getActualYield() != null
                ? production.getActualYield()
                : (production.getRecipes().getEstimatedYield() != null
                ? production.getRecipes().getEstimatedYield().multiply(production.getQuantityProduced())
                : BigDecimal.ONE);

        if (yieldQty.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;

        BigDecimal costPerUnit = totalCost.divide(yieldQty, 2, RoundingMode.HALF_UP);

        // Rekomendasi harga dengan margin 30%
        return costPerUnit.divide(BigDecimal.valueOf(0.70), 2, RoundingMode.HALF_UP);
    }

    private OrderEntity findById(UUID id) {
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order tidak ditemukan"));
        if (order.getIsDeleted()) {
            throw new ResourceNotFoundException("Order tidak ditemukan");
        }
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId != null && !order.getTenant().getId().equals(tenantId)) {
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

    private OrderDetailResponse toDetailResponse(
            OrderEntity order,
            List<OrderItemEntity> items,
            List<OrderPaymentEntity> payments
    ) {
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
                .tenant(order.getTenant().getBusinessName())
                .items(items.stream()
                        .map(item -> OrderItemResponse.builder()
                                .id(item.getId())
                                .productId(item.getProduct().getId())
                                .productName(item.getProduct().getName())
                                .productionId(item.getProduction() != null ? item.getProduction().getId() : null)
                                .productionRecipeVersion(item.getProduction() != null
                                        ? item.getProduction().getRecipes().getVersionNumber() : null)
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