package com.storevo.backend.tenant.model;

// Por qué canal llegó el pedido. No confundir con EventOrigin (que audita QUIÉN
// disparó un cambio de estado): esto describe el canal de VENTA del pedido en sí,
// y no cambia durante su ciclo de vida.
public enum OrderChannel {
    ONLINE("Pago en línea", "bg-storevo-500/10 text-storevo-400 border-storevo-500/20"),
    WHATSAPP("WhatsApp", "bg-emerald-500/10 text-emerald-400 border-emerald-500/20");

    private final String displayName;
    private final String badgeClasses;

    OrderChannel(String displayName, String badgeClasses) {
        this.displayName = displayName;
        this.badgeClasses = badgeClasses;
    }

    public String getDisplayName() { return displayName; }
    public String getBadgeClasses() { return badgeClasses; }
}