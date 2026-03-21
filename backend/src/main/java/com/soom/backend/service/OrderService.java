package com.soom.backend.service;

import com.soom.backend.dto.request.AddPaymentRequest;
import com.soom.backend.dto.request.CreateOrderRequest;
import com.soom.backend.dto.request.OrderItemRequest;
import com.soom.backend.dto.request.UpdateOrderStatusRequest;
import com.soom.backend.dto.response.*;
import com.soom.backend.entity.*;
import com.soom.backend.enums.*;
import com.soom.backend.exception.ResourceNotFoundException;
import com.soom.backend.repository.*;
import com.soom.backend.util.UnitConversionHelper;
import com.soom.backend.utils.OrderNumberGenerator;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
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

    public List<OrderResponse> getAll() {
        return orderRepository.findByIsDeletedFalseOrderByOrderDateDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public OrderDetailResponse getById(UUID id) {
        OrderEntity order = findById(id);
        List<OrderItemEntity> items = orderItemRepository.findByOrderIdAndIsDeletedFalse(id);
        List<OrderPaymentEntity> payments = orderPaymentRepository.findByOrderIdAndIsDeletedFalse(id);
        return toDetailResponse(order, items, payments);
    }

    @Transactional
    public OrderDetailResponse create(CreateOrderRequest request) {
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

            // Kurangi availableQty produksi untuk MADE_TO_STOCK
            if (product.getType() == ProductType.MADE_TO_STOCK) {
                production.setAvailableQty(available.subtract(itemRequest.getQuantity()));
                productionRepository.save(production);

                // Kurangi stok produk
                product.setStockQuantity(
                        product.getStockQuantity().subtract(itemRequest.getQuantity())
                );
                productRepository.save(product);
            }

            // Untuk MADE_TO_ORDER — availableQty dikurangi tapi stok bahan belum berkurang
            // Stok bahan berkurang saat status order = DONE
            if (product.getType() == ProductType.MADE_TO_ORDER) {
                production.setAvailableQty(available.subtract(itemRequest.getQuantity()));
                productionRepository.save(production);
            }
        }

        // Buat order
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

        // Saat order DONE → kurangi stok bahan untuk MADE_TO_ORDER
        if (request.getStatus() == OrderStatus.DONE && oldStatus != OrderStatus.DONE) {
            List<OrderItemEntity> items = orderItemRepository.findByOrderIdAndIsDeletedFalse(id);

            for (OrderItemEntity item : items) {
                ProductEntity product = item.getProduct();

                if (product.getType() != ProductType.MADE_TO_ORDER) continue;
                if (item.getProduction() == null) continue;

                // Ambil resep dari produksi
                ProductRecipesEntity recipe = item.getProduction().getRecipes();
                List<ProductRecipeItemEntity> recipeItems =
                        recipeItemRepository.findByRecipesIdAndIsDeletedFalse(recipe.getId());

                // Hitung jumlah bahan yang dibutuhkan
                // qty order / estimatedYield = berapa batch
                // lalu batch x qty bahan per batch
                BigDecimal estimatedYield = recipe.getEstimatedYield();
                if (estimatedYield == null || estimatedYield.compareTo(BigDecimal.ZERO) == 0) continue;

                BigDecimal batchNeeded = item.getQuantity()
                        .divide(estimatedYield, 4, RoundingMode.HALF_UP);

                for (ProductRecipeItemEntity recipeItem : recipeItems) {
                    IngredientsEntity ingredient = recipeItem.getIngredients();
                    BigDecimal needed = recipeItem.getQuantity().multiply(batchNeeded);

                    ingredient.setStockQuantity(
                            ingredient.getStockQuantity().subtract(needed)
                    );
                    ingredientRepository.save(ingredient);

                    // Catat history stok keluar
                    IngredientStockHistoryEntity stockHistory = new IngredientStockHistoryEntity();
                    stockHistory.setIngredients(ingredient);
                    stockHistory.setType(StockHistoryType.OUT);
                    stockHistory.setQuantity(needed);
                    stockHistory.setNotes("Order selesai: " + order.getOrderNumber());
                    stockHistory.setReferenceType("ORDER");
                    stockHistoryRepository.save(stockHistory);
                }
            }
        }

        // Saat order CANCELLED → kembalikan availableQty produksi
        if (request.getStatus() == OrderStatus.CANCELLED && oldStatus != OrderStatus.CANCELLED) {
            List<OrderItemEntity> items = orderItemRepository.findByOrderIdAndIsDeletedFalse(id);

            for (OrderItemEntity item : items) {
                if (item.getProduction() == null) continue;

                ProductionEntity production = item.getProduction();
                BigDecimal currentAvailable = production.getAvailableQty() != null
                        ? production.getAvailableQty() : BigDecimal.ZERO;

                production.setAvailableQty(currentAvailable.add(item.getQuantity()));
                productionRepository.save(production);

                // Kembalikan stok produk untuk MADE_TO_STOCK
                if (item.getProduct().getType() == ProductType.MADE_TO_STOCK) {
                    ProductEntity product = item.getProduct();
                    product.setStockQuantity(
                            product.getStockQuantity().add(item.getQuantity())
                    );
                    productRepository.save(product);
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
                recipeItemRepository.findByRecipesIdAndIsDeletedFalse(
                        production.getRecipes().getId()
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