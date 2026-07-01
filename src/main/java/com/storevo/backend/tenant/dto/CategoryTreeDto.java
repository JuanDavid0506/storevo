package com.storevo.backend.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

// DTO liviano (sin referencia al padre, sin proxies de Hibernate) pensado
// para serializarse a JSON y alimentar el combobox de categorías del frontend.
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategoryTreeDto {
    private Long id;
    private String name;
    private List<CategoryTreeDto> children;
}