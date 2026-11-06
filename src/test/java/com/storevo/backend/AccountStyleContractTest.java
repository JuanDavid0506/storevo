package com.storevo.backend;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Contrato entre las plantillas de "Mi Cuenta" y el CSS del tema:
 *  - toda clase sv-acct-* usada existe en la sección de store-components.css,
 *  - el CSS solo lee variables que el layout/tema ya publican (o que la propia sección declara),
 *  - las plantillas no vuelven a depender de clases fijas de Tailwind (slate/indigo/bg-white) ni de utilidades
 *    de marca inexistentes que dejaban partes de la vista sin estilo.
 */
class AccountStyleContractTest {

    private static final Path TEMPLATES = Path.of("src/main/resources/templates/storefront/account");
    private static final List<String> FILES = List.of("index.html", "login.html", "forgot-password.html", "reset-password.html", "fragments.html", "verify-required.html", "verify-email.html");
    private static final Path CSS = Path.of("src/main/resources/static/css/store-components.css");
    private static final String START = "Cuenta del comprador (sv-acct-*) · INICIO";
    private static final String END = "Cuenta del comprador (sv-acct-*) · FIN";

    private static String read(Path path) throws IOException {
        return Files.readString(path, StandardCharsets.UTF_8);
    }

    private static String acctSection() throws IOException {
        String css = read(CSS);
        int from = css.indexOf(START);
        int to = css.indexOf(END);
        assertTrue(from >= 0 && to > from, "No se encontró la sección delimitada de la cuenta en store-components.css");
        return css.substring(from, to);
    }

    @Test
    void everyAcctClassUsedInTemplatesIsDefinedInCss() throws IOException {
        String section = acctSection();
        Set<String> missing = new TreeSet<>();
        Pattern token = Pattern.compile("sv-acct-[a-z0-9_]+(?:-[a-z0-9_]+)*(?:__[a-z0-9_]+(?:-[a-z0-9_]+)*)?(?:--[a-z0-9_]+)?");
        for (String file : FILES) {
            Matcher m = token.matcher(read(TEMPLATES.resolve(file)));
            while (m.find()) {
                String cls = m.group();
                if (!Pattern.compile("\\." + Pattern.quote(cls) + "(?![a-zA-Z0-9_-])").matcher(section).find()) {
                    missing.add(cls + " (" + file + ")");
                }
            }
        }
        assertTrue(missing.isEmpty(), "Clases sin definir en CSS: " + missing);
    }

    @Test
    void dynamicModifiersBuiltInTemplatesAreAllDefined() throws IOException {
        String section = acctSection();
        for (String modifier : List.of("sv-acct-pill--pending", "sv-acct-pill--progress", "sv-acct-pill--shipped",
                "sv-acct-pill--done", "sv-acct-pill--cancelled", "sv-acct-alert--success", "sv-acct-alert--error",
                "sv-acct-alert--warn")) {
            assertTrue(section.contains("." + modifier), "Falta el modificador dinámico " + modifier);
        }
    }

    @Test
    void cssOnlyReadsThemeVariablesThatExist() throws IOException {
        String section = acctSection();
        String layout = read(Path.of("src/main/resources/templates/layouts/store-layout.html"));
        Matcher uses = Pattern.compile("var\\(--([a-z0-9-]+)").matcher(section);
        Set<String> unknown = new TreeSet<>();
        while (uses.find()) {
            String name = uses.group(1);
            boolean declaredInSection = Pattern.compile("--" + Pattern.quote(name) + "\\s*:").matcher(section).find();
            boolean publishedByLayout = layout.contains("--" + name);
            if (!declaredInSection && !publishedByLayout) {
                unknown.add("--" + name);
            }
        }
        assertTrue(unknown.isEmpty(), "Variables CSS inexistentes (no inventar tema): " + unknown);
        for (String themeVar : List.of("--brand-color", "--store-radius", "--sv-card-radius", "--font-heading")) {
            assertTrue(layout.contains(themeVar + ":"), "El layout dejó de publicar " + themeVar);
            assertTrue(section.contains("var(" + themeVar), "La cuenta debería usar " + themeVar);
        }
    }

    @Test
    void cssDoesNotHardcodeTheDefaultBrandColor() throws IOException {
        String section = acctSection().toLowerCase();
        assertFalse(section.contains("#6366f1"), "No se debe fijar el color índigo por defecto");
        assertFalse(section.contains("indigo"));
    }

    @Test
    void templatesDoNotDependOnFixedTailwindColorsOrMissingUtilities() throws IOException {
        Pattern forbidden = Pattern.compile(
                "class=\"[^\"]*\\b(?:bg-white|(?:bg|text|border)-(?:slate|indigo|amber|emerald|red|gray)-\\d+|bg-brand|text-brand|border-brand|focus:ring-brand|shadow-2xs)\\b");
        for (String file : FILES) {
            Matcher m = forbidden.matcher(read(TEMPLATES.resolve(file)));
            assertFalse(m.find(), file + " usa una clase fija/inexistente: " + (m.hitEnd() ? "" : m.group()));
        }
    }

    @Test
    void accountPagesKeepAStablePageWhenSwitchingTabs() throws IOException {
        String section = acctSection();
        // 1) La barra de scroll no debe aparecer/desaparecer entre pestañas (desplazaba el contenido ~7 px)
        assertTrue(section.contains("html:has(.sv-acct)") && section.contains("scrollbar-gutter: stable"),
                "Falta reservar el espacio de la barra de scroll en las pantallas de cuenta");
        // 2) El footer se pega al fondo por flex (body.min-h-screen > main.flex-1 > footer mt-auto), no por alturas mínimas arbitrarias
        assertFalse(Pattern.compile("\\.sv-acct(?:-auth)?\\s*\\{[^}]*min-height\\s*:\\s*\\d+vh").matcher(section).find(),
                "Los contenedores de cuenta no deben forzar min-height en vh: ya manda el flex del layout");
        // 2b) En móviles se usa la altura dinámica del viewport, solo en cuenta (no se toca el layout global)
        assertTrue(section.contains("100dvh") && section.contains("body:has(.sv-acct)"));

        String layout = read(Path.of("src/main/resources/templates/layouts/store-layout.html"));
        assertTrue(layout.contains("<body class=\"antialiased min-h-screen flex flex-col\"")
                        && layout.contains("<main id=\"storevoMainContent\" class=\"flex-1 flex flex-col\">")
                        && layout.contains("py-12 mt-auto"),
                "El layout dejó de ser el patrón sticky-footer en el que se apoya Account");

        // 3) Al cambiar de pestaña estando más abajo que el inicio del portal, se vuelve al inicio (no queda a media página)
        String index = read(TEMPLATES.resolve("index.html"));
        assertTrue(index.contains("window.scrollTo(0, Math.max(0, window.scrollY + shellTop - navH - 12))"),
                "Falta volver al inicio del portal al cambiar de pestaña");
    }

    @Test
    void buttonsKeepTheClassesThatInheritTheMerchantsButtonShape() throws IOException {
        // store-components.css adapta data-button-radius solo a <a>/<button> con font-bold + rounded-xl|rounded-lg
        for (String file : List.of("index.html", "login.html", "forgot-password.html", "reset-password.html")) {
            Matcher m = Pattern.compile("<(?:a|button)\\b[^>]*class=\"([^\"]*\\bsv-acct-btn\\b[^\"]*)\"").matcher(read(TEMPLATES.resolve(file)));
            while (m.find()) {
                String classes = m.group(1);
                assertTrue(classes.contains("font-bold") && classes.contains("rounded-xl"),
                        file + ": botón sin font-bold/rounded-xl, no heredaría la forma de botón del tema: " + classes);
            }
        }
    }
}
