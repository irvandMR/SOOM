package com.soom.backend.service;

import com.soom.backend.dto.request.LoginRequest;
import com.soom.backend.dto.response.AuthResponse;
import com.soom.backend.dto.response.UserResponse;
import com.soom.backend.entity.RefreshTokenEntity;
import com.soom.backend.entity.UserEntity;
import com.soom.backend.repository.RefreshTokenRepository;
import com.soom.backend.repository.UserRepository;
import com.soom.backend.security.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.refresh-expiration}")
    private Long refreshExpiration;

    // ── LOGIN ──────────────────────────────────────────
    public AuthResponse login(LoginRequest request, HttpServletResponse response) {

        // Cari user by email
        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email atau password salah"));

        // Cek password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Email atau password salah");
        }

        // Cek apakah user aktif
        if (!user.getIsActive()) {
            throw new RuntimeException("Akun tidak aktif");
        }

        // Generate Access Token
        String accessToken = jwtUtil.generateToken(user);

        // Generate Refresh Token & simpan ke DB
        String refreshToken = generateAndSaveRefreshToken(user);

        // Set Refresh Token ke HttpOnly Cookie
        setRefreshTokenCookie(response, refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .user(UserResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .build())
                .build();
    }

    // ── REFRESH TOKEN ──────────────────────────────────
    public AuthResponse refresh(HttpServletRequest request, HttpServletResponse response) {

        // Ambil refresh token dari Cookie
        String refreshToken = extractRefreshTokenFromCookie(request);

        if (refreshToken == null) {
            throw new RuntimeException("Refresh token tidak ditemukan");
        }

        // Cari di DB
        RefreshTokenEntity tokenEntity = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new RuntimeException("Refresh token tidak valid"));

        // Cek apakah expired
        if (tokenEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(tokenEntity);
            throw new RuntimeException("Refresh token expired, silakan login ulang");
        }

        // Generate Access Token baru
        UserEntity user = tokenEntity.getUser();
        String newAccessToken = jwtUtil.generateToken(user);

        // Rotate refresh token — hapus lama, buat baru
        // Lebih aman: kalau refresh token lama dicuri, tidak bisa dipakai lagi
        refreshTokenRepository.delete(tokenEntity);
        String newRefreshToken = generateAndSaveRefreshToken(user);
        setRefreshTokenCookie(response, newRefreshToken);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .user(UserResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .build())
                .build();
    }

    // ── LOGOUT ─────────────────────────────────────────
    public void logout(HttpServletRequest request, HttpServletResponse response) {

        // Ambil refresh token dari Cookie
        String refreshToken = extractRefreshTokenFromCookie(request);

        // Hapus dari DB kalau ada
        if (refreshToken != null) {
            refreshTokenRepository.findByToken(refreshToken)
                    .ifPresent(refreshTokenRepository::delete);
        }

        // Hapus Cookie
        clearRefreshTokenCookie(response);
    }

    // ── HELPER METHODS ─────────────────────────────────

    private String generateAndSaveRefreshToken(UserEntity user) {
        // Generate random UUID sebagai refresh token
        String token = UUID.randomUUID().toString();

        RefreshTokenEntity refreshTokenEntity = new RefreshTokenEntity();
        refreshTokenEntity.setUser(user);
        refreshTokenEntity.setToken(token);
        refreshTokenEntity.setExpiresAt(
                LocalDateTime.now().plusSeconds(refreshExpiration / 1000));

        refreshTokenRepository.save(refreshTokenEntity);
        return token;
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("refreshToken", token);
        cookie.setHttpOnly(true);   // tidak bisa diakses JavaScript
        cookie.setSecure(false);    // ganti true saat production (HTTPS)
        cookie.setPath("/");
        cookie.setMaxAge((int)(refreshExpiration / 1000));
        response.addCookie(cookie);
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("refreshToken", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(0);  // langsung expired
        response.addCookie(cookie);
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;

        return Arrays.stream(request.getCookies())
                .filter(c -> "refreshToken".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    public UserEntity getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User tidak ditemukan"));
    }
}
