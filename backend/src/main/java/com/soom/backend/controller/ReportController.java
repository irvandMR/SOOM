package com.soom.backend.controller;

import com.soom.backend.dto.response.ProfitLossResponse;
import com.soom.backend.service.ProfitLossService;
import com.soom.backend.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final ProfitLossService profitLossService;

    /**
     * Get Profit & Loss data
     * GET /api/v1/reports/profit-loss?year=2026&month=4
     */
    @GetMapping("/profit-loss")
    public ResponseEntity<ProfitLossResponse> getProfitLoss(
            @RequestParam int year,
            @RequestParam int month
    ) {
        return ResponseEntity.ok(profitLossService.getProfitLoss(year, month));
    }

    /**
     * Download laporan bulanan Excel
     * GET /api/v1/reports/monthly-excel?year=2026&month=4
     */
    @GetMapping("/monthly-excel")
    public ResponseEntity<byte[]> downloadMonthlyReport(
            @RequestParam int year,
            @RequestParam int month
    ) throws IOException {

        byte[] excelData = reportService.generateMonthlyReport(year, month);

        String monthName = Month.of(month).getDisplayName(TextStyle.FULL, new Locale("id"));
        String fileName = "Laporan_Bulanan_" + monthName + "_" + year + ".xlsx";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ));
        headers.setContentDisposition(
                ContentDisposition.attachment().filename(fileName).build()
        );
        headers.setContentLength(excelData.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(excelData);
    }
}
