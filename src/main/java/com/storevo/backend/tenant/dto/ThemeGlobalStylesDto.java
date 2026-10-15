package com.storevo.backend.tenant.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ThemeGlobalStylesDto {
    @Builder.Default
    private String primaryColor = "#6366f1";

    @Builder.Default
    private String secondaryColor = "#0f172a";

    @Builder.Default
    private String backgroundColor = "#f8fafc";

    @Builder.Default
    private String textColor = "#0f172a";

    @Builder.Default
    private String headingFont = "Inter";

    @Builder.Default
    private String bodyFont = "Inter";

    @Builder.Default
    private String borderRadius = "1rem";
}