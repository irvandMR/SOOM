package com.soom.backend.utils;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class AuthUtil {
    public String getCurrentUserEmail() {
        return SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
    }
}
