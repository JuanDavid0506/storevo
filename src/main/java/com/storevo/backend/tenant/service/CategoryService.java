package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.CategoryDto;
import com.storevo.backend.tenant.dto.CategoryTreeDto;
import com.storevo.backend.tenant.model.Category;
import com.storevo.backend.tenant.repository.CategoryRepository;
import com.storevo.backend.tenant.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc();
    }

    public List<Category> getRootCategories() {
        return categoryRepository.findAllRootCategories();
    }

    public List<Category> getNavCategories() {
        return categoryRepository.findRootNavCategories();
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
    }

    // Devuelve el id de la categoría + los ids de TODOS sus descendientes
    // (subcategorías y sub-subcategorías), recorriendo el árbol completo.
    public List<Long> getCategoryAndDescendantIds(Long categoryId) {
        Category category = getCategoryById(categoryId);
        List<Long> ids = new ArrayList<>();
        collectIdsRecursive(category, ids);
        return ids;
    }

    private void collectIdsRecursive(Category category, List<Long> ids) {
        ids.add(category.getId());
        if (category.getSubCategories() != null) {
            for (Category sub : category.getSubCategories()) {
                collectIdsRecursive(sub, ids);
            }
        }
    }

    // Arma el árbol completo de categorías (raíces + descendientes) como DTOs
    public List<CategoryTreeDto> getCategoryTree() {
        List<Category> roots = getRootCategories();
        List<CategoryTreeDto> tree = new ArrayList<>();
        for (Category root : roots) {
            tree.add(toTreeDto(root));
        }
        return tree;
    }

    private CategoryTreeDto toTreeDto(Category category) {
        List<CategoryTreeDto> children = new ArrayList<>();
        if (category.getSubCategories() != null) {
            for (Category sub : category.getSubCategories()) {
                children.add(toTreeDto(sub));
            }
        }
        return CategoryTreeDto.builder()
                .id(category.getId())
                .name(category.getName())
                .children(children)
                .build();
    }

    // Mapa categoryId -> cantidad de productos (Directos + Toda su descendencia).
    // Mantiene la eficiencia de 1 sola consulta a BD, y delega la suma recursiva a la memoria.
    public Map<Long, Long> getProductCountsByCategory() {
        // 1. Obtenemos los conteos directos crudos desde la base de datos
        Map<Long, Long> directCounts = new HashMap<>();
        for (Object[] row : productRepository.countProductsGroupedByCategory()) {
            directCounts.put((Long) row[0], (Long) row[1]);
        }

        // 2. Mapa final para almacenar las sumas acumuladas
        Map<Long, Long> cumulativeCounts = new HashMap<>();

        // 3. Recorremos el árbol desde las raíces hacia abajo para sumar los conteos
        List<Category> rootCategories = getRootCategories();
        for (Category root : rootCategories) {
            calculateCumulativeCount(root, directCounts, cumulativeCounts);
        }

        return cumulativeCounts;
    }

    // Función auxiliar Bottom-Up: Suma los productos de las hojas hacia sus padres
    private long calculateCumulativeCount(Category category, Map<Long, Long> directCounts, Map<Long, Long> cumulativeCounts) {
        // Inicia con el conteo directo de esta categoría
        long total = directCounts.getOrDefault(category.getId(), 0L);

        // Suma recursivamente los conteos de sus subcategorías
        if (category.getSubCategories() != null) {
            for (Category sub : category.getSubCategories()) {
                total += calculateCumulativeCount(sub, directCounts, cumulativeCounts);
            }
        }

        // Guarda el total acumulado para uso en la interfaz
        cumulativeCounts.put(category.getId(), total);

        return total;
    }

    // true si esta categoría todavía puede recibir subcategorías sin romper
    // el límite de 3 niveles (Principal > Sub > Sub-sub).
    public boolean canHaveChildren(Long categoryId) {
        Category category = getCategoryById(categoryId);
        return getCategoryLevel(category) < 3;
    }

    // Calcula el nivel actual en el árbol (1 = Raíz, 2 = Nivel 2, 3 = Nivel 3)
    private int getCategoryLevel(Category category) {
        if (category == null) return 0;
        int level = 1;
        Category current = category.getParentCategory();
        while (current != null) {
            level++;
            current = current.getParentCategory();
        }
        return level;
    }

    // Calcula la profundidad interna (hijos anidados) que posee esta categoría
    private int getMaxDepth(Category category) {
        if (category.getSubCategories() == null || category.getSubCategories().isEmpty()) {
            return 1;
        }
        int maxChildDepth = 0;
        for (Category child : category.getSubCategories()) {
            maxChildDepth = Math.max(maxChildDepth, getMaxDepth(child));
        }
        return 1 + maxChildDepth;
    }

    @Transactional
    public void saveCategory(CategoryDto dto) {
        Category category;
        if (dto.getId() != null) {
            category = getCategoryById(dto.getId());
        } else {
            category = new Category();
        }

        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        category.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : false);
        category.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);

        if (dto.getParentId() != null) {
            // CANDADO DE SEGURIDAD: Las subcategorías NUNCA van en el Navbar principal
            category.setShowInNav(false);

            Category parent = getCategoryById(dto.getParentId());

            // 1. Validar el límite estricto de 3 niveles
            int parentLevel = getCategoryLevel(parent);
            int myInternalDepth = (category.getId() != null) ? getMaxDepth(category) : 1;

            if (parentLevel + myInternalDepth > 3) {
                throw new RuntimeException("Movimiento inválido: Supera el límite de 3 niveles de jerarquía (Principal > Sub > Sub-sub).");
            }

            // 2. Prevenir referencia circular (asignarse a sí misma o a un hijo como padre)
            Category checkCycle = parent;
            while (checkCycle != null) {
                if (checkCycle.getId().equals(category.getId())) {
                    throw new RuntimeException("Movimiento inválido: No puedes asignar un hijo como padre de su categoría actual.");
                }
                checkCycle = checkCycle.getParentCategory();
            }

            category.setParentCategory(parent);
        } else {
            // Si es una categoría principal, respetamos la opción del usuario para el Navbar
            category.setShowInNav(dto.getShowInNav() != null ? dto.getShowInNav() : false);
            category.setParentCategory(null);
        }

        categoryRepository.save(category);
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = getCategoryById(id);

        if (category.getSubCategories() != null && !category.getSubCategories().isEmpty()) {
            throw new RuntimeException("No puedes eliminar \"" + category.getName() + "\" porque todavía tiene subcategorías dentro. Elimínalas primero.");
        }

        long productCount = productRepository.countByCategoryId(id);
        if (productCount > 0) {
            throw new RuntimeException("No puedes eliminar \"" + category.getName() + "\" porque tiene " + productCount + " producto(s) asignado(s). Muévelos a otra categoría antes de eliminarla.");
        }

        categoryRepository.deleteById(id);
    }

    // Intercambia el displayOrder de una categoría con el de su hermana inmediata
    @Transactional
    public void reorderCategory(Long id, String direction) {
        Category category = getCategoryById(id);

        List<Category> siblings = category.getParentCategory() != null
                ? new ArrayList<>(category.getParentCategory().getSubCategories())
                : new ArrayList<>(getRootCategories());

        for (int i = 0; i < siblings.size(); i++) {
            siblings.get(i).setDisplayOrder(i);
        }

        int index = -1;
        for (int i = 0; i < siblings.size(); i++) {
            if (siblings.get(i).getId().equals(id)) {
                index = i;
                break;
            }
        }
        if (index == -1) return;

        int targetIndex = "up".equals(direction) ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < siblings.size()) {
            Category a = siblings.get(index);
            Category b = siblings.get(targetIndex);
            int temp = a.getDisplayOrder();
            a.setDisplayOrder(b.getDisplayOrder());
            b.setDisplayOrder(temp);
        }

        categoryRepository.saveAll(siblings);
    }

    @Transactional
    public void toggleStatus(Long id) {
        Category category = getCategoryById(id);
        category.setIsActive(!category.getIsActive());
        categoryRepository.save(category);
    }
}