package com.storevo.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.storevo.backend.tenant.service.PasswordPolicy;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Paridad REAL entre el servidor y el navegador: ejecuta con Node la misma función de JavaScript que la plantilla
 * entrega al comprador (svPwRuleOk de fragments.html) con las reglas serializadas por PasswordPolicy, y compara cada
 * resultado con la validación en Java. Si Node no está instalado, la prueba se omite (assumption), no falla.
 */
class PasswordPolicyJsParityTest {

    private static final Path FRAGMENTS = Path.of("src/main/resources/templates/storefront/account/fragments.html");

    private static final List<String> CORPUS = List.of(
            "", " ", "a", "1", "abc123", "abcdefg1", "abcdefgh", "12345678", "!!!!!!!!", "       1", "abc1234 ",
            "contraseña1", "Ñandú2026", "con espacios 1", "ÁÉÍÓÚ1234", "中文密码1a23", // chino
            "abcdef1😀", "abcde1😀", "😀😀😀😀1a",
            "a".repeat(71) + "1", "a".repeat(72) + "1", "ñ".repeat(35) + "12", "ñ".repeat(36) + "12",
            "١٢٣٤٥٦٧٨a", // dígitos arábigo-índicos: no son [0-9]
            "Password1", "password", "PASSWORD1", "p4ssw0rd!", "tab\tand1letter", "new\nline1abc");

    @Test
    void theBrowserFunctionAndTheJavaPolicyAgreeOnEveryPassword() throws Exception {
        assumeTrue(nodeAvailable(), "Node no está instalado: se omite la paridad Java↔JS");

        String html = Files.readString(FRAGMENTS, StandardCharsets.UTF_8);
        Matcher fn = Pattern.compile("function svPwRuleOk\\(rule, pwd\\) \\{.*?\\n        \\}\\n", Pattern.DOTALL).matcher(html);
        assertTrue(fn.find(), "No se encontró svPwRuleOk en fragments.html");

        ObjectMapper mapper = new ObjectMapper();
        Path tmp = Files.createTempDirectory("pwparity");
        String script = fn.group() + "\n"
                + "var rules = " + PasswordPolicy.rulesJson() + ";\n"
                + "var corpus = " + mapper.writeValueAsString(CORPUS) + ";\n"
                + "console.log(JSON.stringify(corpus.map(function (p) { return rules.map(function (r) { return svPwRuleOk(r, p); }); })));\n";
        Path file = tmp.resolve("parity.js");
        Files.writeString(file, script, StandardCharsets.UTF_8);

        Process process = new ProcessBuilder("node", file.toString()).redirectErrorStream(true).start();
        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
        assertTrue(process.waitFor(30, TimeUnit.SECONDS), "node no terminó");
        assertEquals(0, process.exitValue(), "node falló: " + output);

        JsonNode results = mapper.readTree(output);
        List<PasswordPolicy.Rule> rules = PasswordPolicy.rules();
        assertEquals(CORPUS.size(), results.size());
        List<String> mismatches = new ArrayList<>();
        for (int i = 0; i < CORPUS.size(); i++) {
            for (int r = 0; r < rules.size(); r++) {
                boolean js = results.get(i).get(r).asBoolean();
                boolean java = rules.get(r).isSatisfiedBy(CORPUS.get(i));
                if (js != java) {
                    mismatches.add("regla '" + rules.get(r).id() + "' con \"" + CORPUS.get(i).replace("\n", "\\n") + "\": JS=" + js + " Java=" + java);
                }
            }
        }
        assertTrue(mismatches.isEmpty(), "El navegador y el servidor discrepan: " + mismatches);
    }

    private static boolean nodeAvailable() {
        try {
            Process p = new ProcessBuilder("node", "--version").redirectErrorStream(true).start();
            p.getInputStream().readAllBytes();
            return p.waitFor(10, TimeUnit.SECONDS) && p.exitValue() == 0;
        } catch (IOException | InterruptedException e) {
            return false;
        }
    }
}
