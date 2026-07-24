package com.storevo.backend.tenant.model;

public enum OrderStatus {
    PENDING("Pendiente", "bg-orange-500/10 text-orange-400 border-orange-500/20"),
    PAID("Pagado", "bg-green-500/10 text-green-400 border-green-500/20"),
    CONFIRMED("Confirmado", "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"),
    PREPARING("En Preparación", "bg-blue-500/10 text-blue-400 border-blue-500/20"),
    PACKED("Empacado", "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"),
    SHIPPED("Enviado", "bg-purple-500/10 text-purple-400 border-purple-500/20"),
    DELIVERED("Entregado", "bg-slate-500/10 text-slate-300 border-slate-500/20"),
    CANCELLED("Cancelado", "bg-red-500/10 text-red-400 border-red-500/20"),
    REFUNDED("Reembolsado", "bg-pink-500/10 text-pink-400 border-pink-500/20");

    private final String displayName;
    private final String badgeClasses;

    OrderStatus(String displayName, String badgeClasses) {
        this.displayName = displayName;
        this.badgeClasses = badgeClasses;
    }

    public String getDisplayName() { return displayName; }
    public String getBadgeClasses() { return badgeClasses; }

    // MÁQUINA DE ESTADOS: Valida transiciones permitidas
    public boolean canTransitionTo(OrderStatus nextStatus) {
        if (this == nextStatus) return false;

        switch (this) {
            case PENDING:
                return nextStatus == PAID || nextStatus == CANCELLED;
            case PAID:
                return nextStatus == CONFIRMED || nextStatus == REFUNDED;
            case CONFIRMED:
                return nextStatus == PREPARING;
            case PREPARING:
                return nextStatus == PACKED;
            case PACKED:
                return nextStatus == SHIPPED;
            case SHIPPED:
                return nextStatus == DELIVERED;
            case DELIVERED:
            case CANCELLED:
            case REFUNDED:
                return false; // Estados finales, no pueden salir de aquí
            default:
                return false;
        }
    }
}