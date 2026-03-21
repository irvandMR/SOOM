package com.soom.backend.utils;

import java.math.BigDecimal;
import java.util.Map;

public class UnitConverter {

    private static final Map<String, BigDecimal> conversionMap = Map.of(
            "kg:g", new BigDecimal("1000"),
            "g:kg", new BigDecimal("0.001"),

            "l:ml", new BigDecimal("1000"),
            "ml:l", new BigDecimal("0.001")
    );

    public static BigDecimal getRatio(String from, String to) {
        if (from.equalsIgnoreCase(to)) {
            return BigDecimal.ONE;
        }

        String key = from.toLowerCase() + ":" + to.toLowerCase();

        BigDecimal ratio = conversionMap.get(key);

        if (ratio == null) {
            throw new RuntimeException("Unit tidak bisa dikonversi dari " + from + " ke " + to);
        }

        return ratio;
    }

    public static boolean canConvert(String from, String to) {
        if (from.equalsIgnoreCase(to)) return true;

        String key = from.toLowerCase() + ":" + to.toLowerCase();
        return conversionMap.containsKey(key);
    }
}