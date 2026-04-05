package com.soom.backend.controller;

import com.soom.backend.dto.request.LoginRequest;
import com.soom.backend.dto.response.AuthResponse;
import com.soom.backend.dto.response.BaseResponse;
import com.soom.backend.dto.response.UserResponse;
import com.soom.backend.entity.UserEntity;
import com.soom.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<BaseResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {

        AuthResponse authResponse = authService.login(request, response);

        return ResponseEntity.ok(BaseResponse.<AuthResponse>builder()
                .success(true)
                .message("Login berhasil")
                .data(authResponse)
                .build());
    }

    @PostMapping("/refresh")
    public ResponseEntity<BaseResponse<AuthResponse>> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {

        AuthResponse authResponse = authService.refresh(request, response);

        return ResponseEntity.ok(BaseResponse.<AuthResponse>builder()
                .success(true)
                .message("Token berhasil diperbarui")
                .data(authResponse)
                .build());
    }

    @PostMapping("/logout")
    public ResponseEntity<BaseResponse<Void>> logout(
            HttpServletRequest request,
            HttpServletResponse response) {

        authService.logout(request, response);

        return ResponseEntity.ok(BaseResponse.<Void>builder()
                .success(true)
                .message("Logout berhasil")
                .data(null)
                .build());
    }

    @GetMapping("/me")
    public ResponseEntity<BaseResponse<UserResponse>> me() {

        // Ambil email dari Security Context (sudah di-set oleh JwtAuthFilter)
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        UserEntity user = authService.getCurrentUser(email);

        return ResponseEntity.ok(BaseResponse.<UserResponse>builder()
                .success(true)
                .message("OK")
                .data(UserResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .build())
                .build());
    }
}
