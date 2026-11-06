package com.storevo.backend.tenant.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Política de contraseñas de los compradores: ÚNICA fuente de verdad.
 *
 * <p>El backend valida con {@link #validate(String)} / {@link #requireValid(String)} y las plantillas generan la
 * lista de requisitos y el JavaScript de validación en tiempo real a partir de {@link #rules()} y
 * {@link #rulesJson()}. Así la interfaz y el servidor no pueden pedir cosas distintas: para cambiar una regla
 * basta con editar este archivo.
 *
 * <p>Reglas: mínimo 8 caracteres, al menos una letra, al menos un número y un máximo de 72 bytes
 * (BCrypt ignora todo lo que supere los 72 bytes, así que una contraseña más larga daría una falsa sensación de seguridad).
 * La contraseña nunca se recorta: los espacios cuentan como cualquier otro carácter.
 */
public final class PasswordPolicy {

    public static final int MIN_LENGTH = 8;
    public static final int MAX_BYTES = 72;

    /** Tipos de regla; el JavaScript implementa exactamente estos tres. */
    public static final String TYPE_MIN_LENGTH = "minLength";
    public static final String TYPE_REGEX = "regex";
    public static final String TYPE_MAX_BYTES = "maxBytes";

    /**
     * @param id                 identificador estable (data-rule en la interfaz)
     * @param label              texto que ve el comprador
     * @param type               {@link #TYPE_MIN_LENGTH}, {@link #TYPE_REGEX} o {@link #TYPE_MAX_BYTES}
     * @param value              límite numérico (minLength / maxBytes); null en las reglas de tipo regex
     * @param pattern            expresión regular (solo type=regex); válida tal cual en Java y en JavaScript (flag "u")
     * @param hiddenUntilViolated si true, la interfaz solo muestra la regla cuando se incumple
     */
    public record Rule(String id, String label, String type, Integer value, String pattern, boolean hiddenUntilViolated) {

        // Accesores estilo JavaBean: las expresiones de Thymeleaf (SpEL) leen ${r.id}, ${r.label}…
        public String getId() {
            return id;
        }

        public String getLabel() {
            return label;
        }

        public boolean isHiddenUntilViolated() {
            return hiddenUntilViolated;
        }

        public boolean isSatisfiedBy(String password) {
            String pwd = password == null ? "" : password;
            return switch (type) {
                case TYPE_MIN_LENGTH -> pwd.codePointCount(0, pwd.length()) >= value;
                case TYPE_MAX_BYTES -> pwd.getBytes(StandardCharsets.UTF_8).length <= value;
                case TYPE_REGEX -> Pattern.compile(pattern).matcher(pwd).find();
                default -> throw new IllegalStateException("Tipo de regla desconocido: " + type);
            };
        }
    }

    private static final List<Rule> RULES = List.of(
            new Rule("length", "Mínimo " + MIN_LENGTH + " caracteres", TYPE_MIN_LENGTH, MIN_LENGTH, null, false),
            new Rule("letter", "Al menos una letra", TYPE_REGEX, null, "\\p{L}", false),
            new Rule("number", "Al menos un número", TYPE_REGEX, null, "[0-9]", false),
            new Rule("maxBytes", "Máximo " + MAX_BYTES + " bytes (los acentos y símbolos ocupan más de uno)",
                    TYPE_MAX_BYTES, MAX_BYTES, null, true)
    );

    private static final String RULES_JSON = buildRulesJson();

    private PasswordPolicy() {
    }

    public static List<Rule> rules() {
        return RULES;
    }

    /** Reglas serializadas para la plantilla (data-attribute del contenedor de requisitos). */
    public static String rulesJson() {
        return RULES_JSON;
    }

    /** Reglas que NO cumple la contraseña indicada (lista vacía = válida). */
    public static List<Rule> validate(String password) {
        List<Rule> failing = new ArrayList<>();
        for (Rule rule : RULES) {
            if (!rule.isSatisfiedBy(password)) {
                failing.add(rule);
            }
        }
        return failing;
    }

    public static boolean isValid(String password) {
        return validate(password).isEmpty();
    }

    /** @throws IllegalArgumentException con un mensaje que enumera exactamente las reglas incumplidas */
    public static void requireValid(String password) {
        List<Rule> failing = validate(password);
        if (failing.isEmpty()) {
            return;
        }
        StringBuilder sb = new StringBuilder("La contraseña no cumple los requisitos: ");
        for (int i = 0; i < failing.size(); i++) {
            String label = failing.get(i).label();
            sb.append(i == 0 ? label : label.substring(0, 1).toLowerCase() + label.substring(1));
            sb.append(i < failing.size() - 1 ? "; " : ".");
        }
        throw new IllegalArgumentException(sb.toString());
    }

    private static String buildRulesJson() {
        List<Map<String, Object>> serializable = new ArrayList<>();
        for (Rule rule : RULES) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", rule.id());
            m.put("label", rule.label());
            m.put("type", rule.type());
            if (rule.value() != null) {
                m.put("value", rule.value());
            }
            if (rule.pattern() != null) {
                m.put("pattern", rule.pattern());
            }
            m.put("hiddenUntilViolated", rule.hiddenUntilViolated());
            serializable.add(m);
        }
        try {
            return new ObjectMapper().writeValueAsString(serializable);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("No se pudo serializar la política de contraseñas", e);
        }
    }
}
