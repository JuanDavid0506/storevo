package com.storevo.backend.tenant.model;

public enum ShipmentStatus {
    CREATED("Creado", "bg-slate-500/10 text-slate-400"),
    LABEL_CREATED("Guía Generada", "bg-blue-500/10 text-blue-400"),
    PICKED_UP("Recolectado", "bg-indigo-500/10 text-indigo-400"),
    IN_TRANSIT("En Tránsito", "bg-purple-500/10 text-purple-400"),
    OUT_FOR_DELIVERY("En Reparto", "bg-orange-500/10 text-orange-400"),
    DELIVERED("Entregado", "bg-green-500/10 text-green-400"),
    RETURNED("Devuelto al Remitente", "bg-red-500/10 text-red-400");

    private final String displayName;
    private final String badgeClasses;

    ShipmentStatus(String displayName, String badgeClasses) {
        this.displayName = displayName;
        this.badgeClasses = badgeClasses;
    }

    public String getDisplayName() { return displayName; }
    public String getBadgeClasses() { return badgeClasses; }
}