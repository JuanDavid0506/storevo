package com.storevo.backend.tenant.model;

public enum DiscountType {
    PERCENTAGE("Porcentaje (%)"),
    FIXED_AMOUNT("Valor fijo ($ COP)");

    private final String displayName;

    DiscountType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}