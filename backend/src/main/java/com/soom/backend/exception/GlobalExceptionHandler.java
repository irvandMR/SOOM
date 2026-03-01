package com.soom.backend.exception;

import com.soom.backend.dto.response.BaseResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Tangkap RuntimeException — error bisnis seperti "password salah", "user tidak ditemukan"
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<BaseResponse<Void>> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity.badRequest()
                .body(BaseResponse.<Void>builder()
                        .success(false)
                        .message(ex.getMessage())
                        .data(null)
                        .build());
    }

    // Tangkap validation error — @Valid gagal di Controller
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<BaseResponse<Void>> handleValidationException(
            MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .findFirst()
                .orElse("Validasi gagal");

        return ResponseEntity.badRequest()
                .body(BaseResponse.<Void>builder()
                        .success(false)
                        .message(message)
                        .data(null)
                        .build());
    }

    // Tangkap semua error yang tidak terduga
    @ExceptionHandler(Exception.class)
    public ResponseEntity<BaseResponse<Void>> handleException(Exception ex) {
        return ResponseEntity.internalServerError()
                .body(BaseResponse.<Void>builder()
                        .success(false)
                        .message("Terjadi kesalahan sistem")
                        .data(null)
                        .build());
    }
}
