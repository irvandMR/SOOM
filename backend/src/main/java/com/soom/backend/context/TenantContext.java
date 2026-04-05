package com.soom.backend.context;

import java.util.UUID;

public class TenantContext {

    private static final ThreadLocal<UUID> currentTenantId = new ThreadLocal<>();
    private static final ThreadLocal<String> currentTenantRole = new ThreadLocal<>();

    public static void setTenantId(UUID tenantId) {
        currentTenantId.set(tenantId);
    }

    public static UUID getTenantId() {
        return currentTenantId.get();
    }

    public static void setTenantRole(String role) {
        currentTenantRole.set(role);
    }

    public static String getTenantRole() {
        return currentTenantRole.get();
    }

    // WAJIB dipanggil setelah request selesai — hindari memory leak
    public static void clear() {
        currentTenantId.remove();
        currentTenantRole.remove();
    }
}