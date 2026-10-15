package com.storevo.backend.tenant.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ThemeConfigDto {

    @Builder.Default
    private ThemeGlobalStylesDto globalStyles = new ThemeGlobalStylesDto();

    @Builder.Default
    private List<ThemeSectionDto> sections = new ArrayList<>();
}