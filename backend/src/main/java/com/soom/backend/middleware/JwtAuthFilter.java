package com.soom.backend.middleware;

import com.soom.backend.security.JwtUtil;
import com.soom.backend.security.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        // Ambil Authorization header dari request
        String authHeader = request.getHeader("Authorization");

        // Kalau tidak ada header atau tidak dimulai dengan "Bearer " → skip, lanjut ke filter berikutnya
        // Endpoint publik seperti /auth/login akan lewat sini tanpa token
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Ambil token — potong "Bearer " (7 karakter) dari depan
        String token = authHeader.substring(7);

        // Validasi token
        if (!jwtUtil.isTokenValid(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Ambil email dari token
        String email = jwtUtil.extractEmail(token);

        // Kalau email ada dan belum ada authentication di context
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // Load user dari DB
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            // Buat authentication object
            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

            // Tambah info request (IP, dll)
            authToken.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request));

            // Set authentication ke Spring Security context
            // Setelah ini Spring tahu siapa yang sedang request
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        // Lanjut ke filter berikutnya
        filterChain.doFilter(request, response);


    }
}
