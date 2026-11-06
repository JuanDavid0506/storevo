package com.storevo.backend;

import org.junit.jupiter.api.Test;
import org.springframework.context.expression.MapAccessor;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Auditoría C4: los th:if de los mensajes flash del portal "Mi Cuenta" deben evaluar sin error
 * tanto cuando no hay mensaje (null) como cuando el mensaje es un String.
 */
class AccountTemplateExpressionsTest {

    private static final Pattern FLASH_IF = Pattern.compile(
            "th:if=\"\\$\\{([^}]*(?:accountSuccess|accountError|reviewSuccess|reviewError)[^}]*)}\"");

    @Test
    void flashMessageConditions_evaluateWithNullAndStringValues() throws Exception {
        String html = Files.readString(
                Path.of("src/main/resources/templates/storefront/account/index.html"), StandardCharsets.UTF_8);

        List<String> expressions = new ArrayList<>();
        Matcher m = FLASH_IF.matcher(html);
        while (m.find()) {
            expressions.add(m.group(1));
        }
        assertFalse(expressions.isEmpty(), "No se encontraron condiciones de mensajes flash en index.html");

        SpelExpressionParser parser = new SpelExpressionParser();
        for (String expr : expressions) {
            for (Object value : new Object[]{null, "Mensaje de prueba"}) {
                Map<String, Object> vars = new HashMap<>();
                vars.put("accountSuccess", value);
                vars.put("accountError", value);
                vars.put("reviewSuccess", null);
                vars.put("reviewError", null);
                StandardEvaluationContext ctx = new StandardEvaluationContext(vars);
                ctx.addPropertyAccessor(new MapAccessor());

                Boolean result = assertDoesNotThrow(
                        () -> parser.parseExpression(expr).getValue(ctx, Boolean.class),
                        "La expresión '" + expr + "' falla con valor " + value);
                assertEquals(value != null, result, "Resultado inesperado para '" + expr + "'");
            }
        }
    }
}
