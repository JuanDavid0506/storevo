package com.storevo.backend.tenant.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

class PasswordPolicyTest {

    private static List<String> failingIds(String password) {
        return PasswordPolicy.validate(password).stream().map(PasswordPolicy.Rule::id).collect(Collectors.toList());
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "abcdefg1",                 // exactamente 8 caracteres, letra y número
            "contraseña1",              // ñ cuenta como letra
            "Ñandú2026",                // mayúscula acentuada
            "con espacios 1",           // los espacios internos son válidos
            "abc1234 ",                 // el espacio final NO se recorta: son 8 caracteres
            "12345678a",                // letra al final
    })
    void validPasswords(String password) {
        assertTrue(PasswordPolicy.isValid(password), password);
        assertDoesNotThrow(() -> PasswordPolicy.requireValid(password));
    }

    @Test
    void shortPasswordFailsOnlyLength() {
        assertEquals(List.of("length"), failingIds("abc123"));
        // Antes se aplicaba trim(): "abc123  " (8 con espacios) pasaba el largo; ahora también, pero "       1" no tiene letra
        assertEquals(List.of("letter"), failingIds("       1"));
    }

    @Test
    void lettersOnlyAndDigitsOnlyFailTheMissingRule() {
        assertEquals(List.of("number"), failingIds("abcdefgh"));
        assertEquals(List.of("letter"), failingIds("12345678"));
        assertEquals(List.of("letter", "number"), failingIds("!!!!!!!!"));
    }

    @Test
    void nullAndEmptyFailEverythingExceptTheUpperBound() {
        assertEquals(List.of("length", "letter", "number"), failingIds(null));
        assertEquals(List.of("length", "letter", "number"), failingIds(""));
    }

    @Test
    void upperBoundIsMeasuredInBytesNotCharacters() {
        String ascii72 = "a".repeat(71) + "1";           // 72 bytes
        String ascii73 = "a".repeat(72) + "1";           // 73 bytes
        String accents72 = "ñ".repeat(35) + "12";        // 35*2 + 2 = 72 bytes
        String accents74 = "ñ".repeat(36) + "12";        // 74 bytes (solo 38 caracteres)
        assertTrue(PasswordPolicy.isValid(ascii72));
        assertEquals(List.of("maxBytes"), failingIds(ascii73));
        assertTrue(PasswordPolicy.isValid(accents72));
        assertEquals(List.of("maxBytes"), failingIds(accents74));
    }

    @Test
    void lengthCountsCodePointsSoAnEmojiIsOneCharacter() {
        // 6 letras + 1 número + 1 emoji (2 chars UTF-16, 1 punto de código) = 8 puntos de código
        assertTrue(PasswordPolicy.isValid("abcdef1😀"));
        assertEquals(List.of("length"), failingIds("abcde1😀"));
    }

    @Test
    void errorMessageListsExactlyTheFailingRules() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> PasswordPolicy.requireValid("abc"));
        assertEquals("La contraseña no cumple los requisitos: Mínimo 8 caracteres; al menos un número.", ex.getMessage());

        IllegalArgumentException none = assertThrows(IllegalArgumentException.class, () -> PasswordPolicy.requireValid(null));
        assertTrue(none.getMessage().contains("Mínimo 8 caracteres")
                && none.getMessage().contains("al menos una letra")
                && none.getMessage().contains("al menos un número"));
    }

    @Test
    void rulesJsonDescribesEveryRuleWithATypeTheClientImplements() {
        String json = PasswordPolicy.rulesJson();
        for (PasswordPolicy.Rule rule : PasswordPolicy.rules()) {
            assertTrue(json.contains("\"id\":\"" + rule.id() + "\""), rule.id());
            assertTrue(List.of(PasswordPolicy.TYPE_MIN_LENGTH, PasswordPolicy.TYPE_MAX_BYTES, PasswordPolicy.TYPE_REGEX).contains(rule.type()));
        }
        assertTrue(json.startsWith("[") && json.endsWith("]"));
    }
}
