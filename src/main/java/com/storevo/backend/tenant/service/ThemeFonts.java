package com.storevo.backend.tenant.service;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

/**
 * Catálogo único de tipografías permitidas en las tiendas.
 * Para agregar una fuente nueva basta con registrarla aquí
 * (y añadir su <option> en el editor).
 */
public final class ThemeFonts {

    public static final String DEFAULT_FONT = "Inter";

    private ThemeFonts() {}

    /** weights: pesos válidos en Google Fonts; body: si se permite como fuente de textos */
    private record Font(String weights, boolean body) {}

    private static final Map<String, Font> FONTS = new LinkedHashMap<>();

    static {
        // Modernas y limpias
        FONTS.put("Inter", new Font("400;500;600;700;800;900", true));
        FONTS.put("Plus Jakarta Sans", new Font("400;500;600;700;800", true));
        FONTS.put("DM Sans", new Font("400;500;600;700;800", true));
        FONTS.put("Poppins", new Font("400;500;600;700;800", true));
        FONTS.put("Outfit", new Font("400;500;600;700;800", true));
        FONTS.put("Manrope", new Font("400;500;600;700;800", true));
        // Audaces y urbanas
        FONTS.put("Montserrat", new Font("400;500;600;700;800", true));
        FONTS.put("Space Grotesk", new Font("400;500;600;700", true));
        FONTS.put("Syne", new Font("400;500;600;700;800", false));
        FONTS.put("Oswald", new Font("400;500;600;700", false));
        // Editoriales y de lujo
        FONTS.put("Playfair Display", new Font("400;500;600;700;800", false));
        FONTS.put("Cormorant Garamond", new Font("400;500;600;700", false));
        FONTS.put("Lora", new Font("400;500;600;700", true));
        FONTS.put("Cinzel", new Font("400;500;600;700;800", false));
        // Cercanas y orgánicas
        FONTS.put("Nunito", new Font("400;500;600;700;800", true));
        FONTS.put("Quicksand", new Font("400;500;600;700", true));
    }

    public static boolean isHeadingFont(String name) {
        return name != null && FONTS.containsKey(name);
    }

    public static boolean isBodyFont(String name) {
        Font f = name == null ? null : FONTS.get(name);
        return f != null && f.body();
    }

    /** URL de Google Fonts solo con las fuentes activas de la tienda (tienda pública). */
    public static String buildActiveFontsUrl(String heading, String body) {
        Set<String> names = new TreeSet<>();
        names.add(isHeadingFont(heading) ? heading : DEFAULT_FONT);
        names.add(isBodyFont(body) ? body : DEFAULT_FONT);
        return buildUrl(names);
    }

    /** URL con todas las fuentes (solo para la vista previa del editor). */
    public static String buildAllFontsUrl() {
        return buildUrl(new TreeSet<>(FONTS.keySet()));
    }

    private static String buildUrl(Collection<String> names) {
        String families = names.stream()
                .map(n -> "family=" + n.replace(' ', '+') + ":wght@" + FONTS.get(n).weights())
                .collect(Collectors.joining("&"));
        return "https://fonts.googleapis.com/css2?" + families + "&display=swap";
    }
}