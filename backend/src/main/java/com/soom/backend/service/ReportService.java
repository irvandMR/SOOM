package com.soom.backend.service;

import com.soom.backend.entity.IngredientsEntity;
import com.soom.backend.entity.OrderEntity;
import com.soom.backend.entity.ProductionEntity;
import com.soom.backend.enums.OrderStatus;
import com.soom.backend.enums.ProductionStatus;
import com.soom.backend.enums.StockHistoryType;
import com.soom.backend.repository.*;
import com.soom.backend.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final IngredientStockHistoryRepository stockHistoryRepository;
    private final IngredientRepository ingredientRepository;
    private final OrderRepository orderRepository;
    private final ProductionRepository productionRepository;

    /**
     * Generate monthly Excel report with 5 sheets
     */
    public byte[] generateMonthlyReport(int year, int month) throws IOException {
        UUID tenantId = TenantContext.getTenantId();
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        String monthLabel = Month.of(month).getDisplayName(TextStyle.FULL, new Locale("id")) + " " + year;

        try (Workbook workbook = new XSSFWorkbook()) {
            // Create styles
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle totalStyle = createTotalStyle(workbook);

            // Sheet 1 - Pembelian Bahan
            buildPembelianBahanSheet(workbook, headerStyle, currencyStyle, titleStyle, totalStyle,
                    tenantId, startDate, endDate, monthLabel);

            // Sheet 2 - Pemakaian Bahan
            buildPemakaianBahanSheet(workbook, headerStyle, currencyStyle, titleStyle, totalStyle,
                    tenantId, startDate, endDate, monthLabel);

            // Sheet 3 - Sisa Stok Bahan
            buildSisaStokSheet(workbook, headerStyle, currencyStyle, titleStyle,
                    tenantId, monthLabel);

            // Sheet 4 - Total Order
            buildTotalOrderSheet(workbook, headerStyle, currencyStyle, titleStyle, totalStyle,
                    tenantId, startDate, endDate, monthLabel);

            // Sheet 5 - Produksi Gagal
            buildProduksiGagalSheet(workbook, headerStyle, titleStyle,
                    tenantId, startDate, endDate, monthLabel);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    // ── SHEET 1: PEMBELIAN BAHAN ─────────────────────────────────────────────
    private void buildPembelianBahanSheet(Workbook wb, CellStyle headerStyle, CellStyle currencyStyle,
                                           CellStyle titleStyle, CellStyle totalStyle,
                                           UUID tenantId, LocalDate start, LocalDate end, String monthLabel) {
        Sheet sheet = wb.createSheet("Pembelian Bahan");
        int rowNum = 0;

        // Title
        Row titleRow = sheet.createRow(rowNum++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("LAPORAN PEMBELIAN BAHAN — " + monthLabel.toUpperCase());
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 5));
        rowNum++;

        // Header
        String[] headers = {"Nama Bahan", "Tanggal", "Qty", "Satuan", "Harga Satuan (Rp)", "Total (Rp)"};
        Row headerRow = sheet.createRow(rowNum++);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // Data
        var histories = stockHistoryRepository
                .findByTypeAndTenantIdAndDateRange(tenantId, StockHistoryType.IN, start, end);

        BigDecimal grandTotal = BigDecimal.ZERO;
        for (var h : histories) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(h.getIngredients().getName());
            row.createCell(1).setCellValue(h.getCreatedAt() != null
                    ? h.getCreatedAt().toLocalDate().toString() : "");
            row.createCell(2).setCellValue(h.getQuantity().doubleValue());
            row.createCell(3).setCellValue(h.getIngredients().getUnit().getSymbol());

            Cell priceCell = row.createCell(4);
            BigDecimal price = h.getPurchasePrice() != null ? h.getPurchasePrice() : BigDecimal.ZERO;
            priceCell.setCellValue(price.doubleValue());
            priceCell.setCellStyle(currencyStyle);

            BigDecimal total = price.multiply(h.getQuantity());
            Cell totalCell = row.createCell(5);
            totalCell.setCellValue(total.doubleValue());
            totalCell.setCellStyle(currencyStyle);
            grandTotal = grandTotal.add(total);
        }

        // Total row
        Row totalRow = sheet.createRow(rowNum);
        Cell totalLabel = totalRow.createCell(4);
        totalLabel.setCellValue("GRAND TOTAL");
        totalLabel.setCellStyle(totalStyle);
        Cell totalVal = totalRow.createCell(5);
        totalVal.setCellValue(grandTotal.doubleValue());
        totalVal.setCellStyle(totalStyle);

        for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
    }

    // ── SHEET 2: PEMAKAIAN BAHAN ─────────────────────────────────────────────
    private void buildPemakaianBahanSheet(Workbook wb, CellStyle headerStyle, CellStyle currencyStyle,
                                           CellStyle titleStyle, CellStyle totalStyle,
                                           UUID tenantId, LocalDate start, LocalDate end, String monthLabel) {
        Sheet sheet = wb.createSheet("Pemakaian Bahan");
        int rowNum = 0;

        Row titleRow = sheet.createRow(rowNum++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("LAPORAN PEMAKAIAN BAHAN — " + monthLabel.toUpperCase());
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 4));
        rowNum++;

        String[] headers = {"Nama Bahan", "Tanggal", "Qty Terpakai", "Satuan", "Keterangan"};
        Row headerRow = sheet.createRow(rowNum++);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        var histories = stockHistoryRepository
                .findByTypeAndTenantIdAndDateRange(tenantId, StockHistoryType.OUT, start, end);

        // Group by ingredient
        Map<String, BigDecimal> usageMap = new LinkedHashMap<>();
        Map<String, List<String>> detailMap = new LinkedHashMap<>();

        for (var h : histories) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(h.getIngredients().getName());
            row.createCell(1).setCellValue(h.getCreatedAt() != null
                    ? h.getCreatedAt().toLocalDate().toString() : "");
            row.createCell(2).setCellValue(h.getQuantity().doubleValue());
            row.createCell(3).setCellValue(h.getIngredients().getUnit().getSymbol());
            row.createCell(4).setCellValue(h.getNotes() != null ? h.getNotes() : "");

            usageMap.merge(h.getIngredients().getName(), h.getQuantity(), BigDecimal::add);
        }

        for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
    }

    // ── SHEET 3: SISA STOK BAHAN ─────────────────────────────────────────────
    private void buildSisaStokSheet(Workbook wb, CellStyle headerStyle, CellStyle currencyStyle,
                                     CellStyle titleStyle, UUID tenantId, String monthLabel) {
        Sheet sheet = wb.createSheet("Sisa Stok Bahan");
        int rowNum = 0;

        Row titleRow = sheet.createRow(rowNum++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("SISA STOK BAHAN — " + monthLabel.toUpperCase());
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 5));
        rowNum++;

        String[] headers = {"Nama Bahan", "Kategori", "Stok Saat Ini", "Stok Minimum", "Satuan", "Status", "Harga Avg (Rp)", "Nilai Stok (Rp)"};
        Row headerRow = sheet.createRow(rowNum++);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        var ingredients = ingredientRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        BigDecimal totalNilai = BigDecimal.ZERO;

        for (IngredientsEntity ing : ingredients) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(ing.getName());
            row.createCell(1).setCellValue(ing.getCategory().getName());
            row.createCell(2).setCellValue(ing.getStockQuantity().doubleValue());
            row.createCell(3).setCellValue(ing.getMinimumStock().doubleValue());
            row.createCell(4).setCellValue(ing.getUnit().getSymbol());
            boolean isCritical = ing.getStockQuantity().compareTo(ing.getMinimumStock()) <= 0;
            row.createCell(5).setCellValue(isCritical ? "⚠ Kritis" : "Aman");

            Cell avgCell = row.createCell(6);
            avgCell.setCellValue(ing.getAvgPurchasePrice().doubleValue());
            avgCell.setCellStyle(currencyStyle);

            BigDecimal nilaiStok = ing.getStockQuantity().multiply(ing.getAvgPurchasePrice());
            Cell nilaiCell = row.createCell(7);
            nilaiCell.setCellValue(nilaiStok.doubleValue());
            nilaiCell.setCellStyle(currencyStyle);
            totalNilai = totalNilai.add(nilaiStok);
        }

        for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
    }

    // ── SHEET 4: TOTAL ORDER ─────────────────────────────────────────────────
    private void buildTotalOrderSheet(Workbook wb, CellStyle headerStyle, CellStyle currencyStyle,
                                       CellStyle titleStyle, CellStyle totalStyle,
                                       UUID tenantId, LocalDate start, LocalDate end, String monthLabel) {
        Sheet sheet = wb.createSheet("Total Order");
        int rowNum = 0;

        Row titleRow = sheet.createRow(rowNum++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("LAPORAN TOTAL ORDER — " + monthLabel.toUpperCase());
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 4));
        rowNum++;

        // Summary by status
        String[] summaryHeaders = {"Status", "Jumlah Order", "Total Nilai (Rp)", "Nilai Terbayar (Rp)", "Sisa (Rp)"};
        Row summaryHeaderRow = sheet.createRow(rowNum++);
        for (int i = 0; i < summaryHeaders.length; i++) {
            Cell cell = summaryHeaderRow.createCell(i);
            cell.setCellValue(summaryHeaders[i]);
            cell.setCellStyle(headerStyle);
        }

        var orders = orderRepository.findByTenantIdAndDateRange(tenantId, start, end);
        Map<String, List<OrderEntity>> byStatus = orders.stream()
                .collect(Collectors.groupingBy(o -> o.getStatus().name()));

        for (OrderStatus status : OrderStatus.values()) {
            List<OrderEntity> statusOrders = byStatus.getOrDefault(status.name(), List.of());
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(status.name());
            row.createCell(1).setCellValue(statusOrders.size());

            BigDecimal total = statusOrders.stream()
                    .map(OrderEntity::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            Cell totalCell = row.createCell(2);
            totalCell.setCellValue(total.doubleValue());
            totalCell.setCellStyle(currencyStyle);

            BigDecimal paid = statusOrders.stream()
                    .map(OrderEntity::getPaidAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            Cell paidCell = row.createCell(3);
            paidCell.setCellValue(paid.doubleValue());
            paidCell.setCellStyle(currencyStyle);

            Cell sisaCell = row.createCell(4);
            sisaCell.setCellValue(total.subtract(paid).doubleValue());
            sisaCell.setCellStyle(currencyStyle);
        }

        rowNum++;
        // Detail orders
        Row detailTitleRow = sheet.createRow(rowNum++);
        detailTitleRow.createCell(0).setCellValue("DETAIL ORDER");

        String[] detailHeaders = {"No. Order", "Customer", "Tgl Order", "Status", "Total (Rp)", "Terbayar (Rp)", "Status Bayar"};
        Row detailHeaderRow = sheet.createRow(rowNum++);
        for (int i = 0; i < detailHeaders.length; i++) {
            Cell cell = detailHeaderRow.createCell(i);
            cell.setCellValue(detailHeaders[i]);
            cell.setCellStyle(headerStyle);
        }

        for (OrderEntity order : orders) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(order.getOrderNumber());
            row.createCell(1).setCellValue(order.getCustomerName());
            row.createCell(2).setCellValue(order.getOrderDate().toString());
            row.createCell(3).setCellValue(order.getStatus().name());
            Cell totalCell = row.createCell(4);
            totalCell.setCellValue(order.getTotalAmount().doubleValue());
            totalCell.setCellStyle(currencyStyle);
            Cell paidCell = row.createCell(5);
            paidCell.setCellValue(order.getPaidAmount().doubleValue());
            paidCell.setCellStyle(currencyStyle);
            row.createCell(6).setCellValue(order.getPaymentStatus().name());
        }

        for (int i = 0; i < 7; i++) sheet.autoSizeColumn(i);
    }

    // ── SHEET 5: PRODUKSI GAGAL ──────────────────────────────────────────────
    private void buildProduksiGagalSheet(Workbook wb, CellStyle headerStyle,
                                          CellStyle titleStyle, UUID tenantId,
                                          LocalDate start, LocalDate end, String monthLabel) {
        Sheet sheet = wb.createSheet("Produksi Gagal");
        int rowNum = 0;

        Row titleRow = sheet.createRow(rowNum++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("PRODUKSI GAGAL — " + monthLabel.toUpperCase());
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 4));
        rowNum++;

        String[] headers = {"Produk", "Versi Resep", "Qty Produksi", "Satuan", "Tgl Produksi", "Catatan"};
        Row headerRow = sheet.createRow(rowNum++);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        var failedProductions = productionRepository
                .findByTenantIdAndStatusAndDateRange(tenantId, ProductionStatus.FAILED, start, end);

        if (failedProductions.isEmpty()) {
            Row row = sheet.createRow(rowNum);
            row.createCell(0).setCellValue("Tidak ada produksi gagal pada bulan ini ✅");
        } else {
            for (ProductionEntity prod : failedProductions) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(prod.getProduct().getName());
                row.createCell(1).setCellValue("v" + prod.getRecipes().getVersionNumber());
                row.createCell(2).setCellValue(prod.getQuantityProduced().doubleValue());
                row.createCell(3).setCellValue(prod.getProduct().getUnit().getSymbol());
                row.createCell(4).setCellValue(prod.getProductionDate().toString());
                row.createCell(5).setCellValue(prod.getNotes() != null ? prod.getNotes() : "");
            }
        }

        for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
    }

    // ── STYLE HELPERS ────────────────────────────────────────────────────────
    private CellStyle createHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createTitleStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        style.setFont(font);
        return style;
    }

    private CellStyle createCurrencyStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        DataFormat format = wb.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0"));
        return style;
    }

    private CellStyle createTotalStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        DataFormat format = wb.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0"));
        style.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }
}