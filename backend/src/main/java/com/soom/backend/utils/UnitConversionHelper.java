package com.soom.backend.util;

import com.soom.backend.entity.UnitsEntity;
import java.math.BigDecimal;
import java.math.RoundingMode;

public class UnitConversionHelper {

    /**
     * Konversi qty ke base unit
     * misal: 2 kg → 2000 g (factor=1000)
     */
    public static BigDecimal toBaseUnit(BigDecimal qty, UnitsEntity unit) {
        if (unit.getConversionFactor() == null) return qty;
        return qty.multiply(unit.getConversionFactor());
    }

    /**
     * Konversi qty dari base unit ke unit tertentu
     * misal: 2000 g → 2 kg
     */
    public static BigDecimal fromBaseUnit(BigDecimal qty, UnitsEntity unit) {
        if (unit.getConversionFactor() == null) return qty;
        return qty.divide(unit.getConversionFactor(), 4, RoundingMode.HALF_UP);
    }

    /**
     * Cek apakah 2 unit compatible (sama base unit-nya)
     * misal: kg & g → compatible (sama-sama base: g)
     * misal: kg & ml → tidak compatible
     */
    public static boolean isCompatible(UnitsEntity unit1, UnitsEntity unit2) {
        if (unit1.getBaseUnit() == null || unit2.getBaseUnit() == null) return false;
        return unit1.getBaseUnit().equals(unit2.getBaseUnit());
    }

    /**
     * Konversi qty dari unit asal ke unit tujuan
     * misal: 2 kg → 2000 g
     */
    public static BigDecimal convert(BigDecimal qty, UnitsEntity from, UnitsEntity to) {
        if (from.getId().equals(to.getId())) return qty; // same unit
        if (!isCompatible(from, to)) {
            throw new RuntimeException(
                    "Unit tidak compatible: " + from.getSymbol() + " → " + to.getSymbol()
            );
        }
        BigDecimal inBase = toBaseUnit(qty, from);
        return fromBaseUnit(inBase, to);
    }

    /**
     * Cek apakah stok cukup dengan mempertimbangkan konversi
     * misal: stok 1kg, butuh 500g → cukup
     */
    public static boolean isStockSufficient(
            BigDecimal stockQty, UnitsEntity stockUnit,
            BigDecimal neededQty, UnitsEntity neededUnit
    ) {
        // Konversi keduanya ke base unit untuk perbandingan
        BigDecimal stockInBase = toBaseUnit(stockQty, stockUnit);
        BigDecimal neededInBase = toBaseUnit(neededQty, neededUnit);
        return stockInBase.compareTo(neededInBase) >= 0;
    }
}