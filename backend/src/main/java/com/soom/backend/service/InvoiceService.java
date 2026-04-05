package com.soom.backend.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.soom.backend.context.TenantContext;
import com.soom.backend.entity.*;
import com.soom.backend.exception.ResourceNotFoundException;
import com.soom.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final TenantRepository tenantRepository;
    private final SpringTemplateEngine templateEngine;

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd MMMM yyyy", new Locale("id"));

    private static final NumberFormat RUPIAH =
            NumberFormat.getInstance(new Locale("id", "ID"));

    public byte[] generateInvoicePdf(UUID orderId) {

        // 🔹 GET ORDER
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order tidak ditemukan"));

        if (order.getIsDeleted()) {
            throw new ResourceNotFoundException("Order tidak ditemukan");
        }

        // 🔹 VALIDASI TENANT
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId != null && !order.getTenant().getId().equals(tenantId)) {
            throw new ResourceNotFoundException("Order tidak ditemukan");
        }

        TenantEntity tenant = tenantRepository.getReferenceById(tenantId);

        // 🔹 ITEMS
        List<OrderItemEntity> items =
                orderItemRepository.findByOrderIdAndIsDeletedFalse(orderId);

        List<Map<String, String>> itemList = items.stream().map(item -> {
            Map<String, String> map = new HashMap<>();
            map.put("productName", item.getProduct().getName());
            map.put("quantity",
                    item.getQuantity().stripTrailingZeros().toPlainString()
                            + " " + item.getProduct().getUnit().getSymbol());
            map.put("unitPrice", "Rp " + RUPIAH.format(item.getUnitPrice()));
            map.put("subtotal", "Rp " + RUPIAH.format(item.getSubtotal()));
            return map;
        }).toList();

        BigDecimal remaining =
                order.getTotalAmount().subtract(order.getPaidAmount());

        // 🔥 CONTEXT (pengganti Model)
        Context context = new Context();
        context.setVariable("businessName", tenant.getBusinessName());
        context.setVariable("businessAddress", tenant.getAddress());
        context.setVariable("businessPhone", tenant.getPhone());
        context.setVariable("businessEmail", tenant.getEmail());

        context.setVariable("orderNumber", order.getOrderNumber());
        context.setVariable("orderDate", order.getOrderDate().format(DATE_FMT));
        context.setVariable("requiredDate",
                order.getRequiredDate() != null
                        ? order.getRequiredDate().format(DATE_FMT)
                        : "-");

        context.setVariable("customerName", order.getCustomerName());
        context.setVariable("customerPhone",
                Optional.ofNullable(order.getCustomerPhone()).orElse("-"));
        context.setVariable("customerAddress",
                Optional.ofNullable(order.getCustomerAddress()).orElse("-"));

        context.setVariable("paymentStatus",
                formatPaymentStatus(order.getPaymentStatus().name()));

        context.setVariable("items", itemList);

        context.setVariable("totalAmount",
                "Rp " + RUPIAH.format(order.getTotalAmount()));
        context.setVariable("paidAmount",
                "Rp " + RUPIAH.format(order.getPaidAmount()));
        context.setVariable("remainingAmount",
                "Rp " + RUPIAH.format(remaining));
        context.setVariable("paymentStatus",
                formatPaymentStatus(order.getPaymentStatus().name()));

        context.setVariable("notes", order.getNotes());

        // 🔥 RENDER HTML
        String html = templateEngine.process("invoice", context);

        // 🔥 CONVERT KE PDF
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {

            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.withHtmlContent(html, null);
            builder.toStream(os);
            builder.run();

            return os.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Gagal generate PDF", e);
        }
    }

    public String generateFileName(UUID orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order tidak ditemukan"));

        UUID tenantId = TenantContext.getTenantId();
        if (tenantId != null && !order.getTenant().getId().equals(tenantId)) {
            throw new ResourceNotFoundException("Order tidak ditemukan");
        }

        TenantEntity tenant = tenantRepository.getReferenceById(tenantId);

        String businessName = sanitizeFileName(tenant.getBusinessName());
        String orderNumber = sanitizeFileName(order.getOrderNumber());

        String date = order.getOrderDate()
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

        return String.format(
                "order-%s-%s-%s.pdf",
                businessName,
                orderNumber,
                date
        );
    }

    private String sanitizeFileName(String input) {
        if (input == null) return "unknown";

        return input
                .toLowerCase()
                .replaceAll("[^a-z0-9]", "-") // selain huruf/angka jadi "-"
                .replaceAll("-+", "-")        // hindari ----
                .replaceAll("^-|-$", "");     // hapus - di awal/akhir
    }

    private String formatPaymentStatus(String status) {
        return switch (status) {
            case "UNPAID" -> "Belum Bayar";
            case "DP" -> "DP";
            case "PAID" -> "Lunas";
            default -> status;
        };
    }
}