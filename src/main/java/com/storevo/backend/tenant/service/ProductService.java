package com.storevo.backend.tenant.service;

import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.ProductDto;
import com.storevo.backend.tenant.model.Category;
import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.model.ProductImage;
import com.storevo.backend.tenant.repository.CategoryRepository;
import com.storevo.backend.tenant.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;
    private final ImageStorageService imageStorageService; // NUEVO SERVICIO

    public List<Product> getAllProducts() {
        return productRepository.findByIsDeletedFalseOrderByIdDesc();
    }

    public List<Product> getPublicCatalog(Long categoryId) {
        if (categoryId == null) {
            return productRepository.findByIsActiveTrueAndIsDeletedFalseOrderByIdDesc();
        }
        List<Long> categoryIds = categoryService.getCategoryAndDescendantIds(categoryId);
        return productRepository.findActiveProductsByCategoryIds(categoryIds);
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
    }

    @Transactional
    public void saveProduct(ProductDto dto) {
        Product product;
        boolean isNew = dto.getId() == null;

        if (!isNew) {
            product = getProductById(dto.getId());
        } else {
            product = new Product();
        }

        // 1. Mapeo de datos básicos
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        product.setDiscountPrice(dto.getDiscountPrice());
        product.setStock(dto.getStock());
        product.setBrand(dto.getBrand());
        product.setSku(dto.getSku());
        product.setWeight(dto.getWeight());
        product.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : false);

        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Categoría inválida"));
            product.setCategory(category);
        } else {
            product.setCategory(null);
        }

        Map<String, String> attributes = new HashMap<>();
        if (dto.getAttrKeys() != null && dto.getAttrValues() != null) {
            for (int i = 0; i < dto.getAttrKeys().size(); i++) {
                String k = dto.getAttrKeys().get(i);
                String v = dto.getAttrValues().get(i);
                if (k != null && !k.trim().isEmpty() && v != null && !v.trim().isEmpty()) {
                    attributes.put(k.trim(), v.trim());
                }
            }
        }
        product.setAttributes(attributes.isEmpty() ? null : attributes);

        // 2. Guardar el producto primero si es nuevo para obtener el ID (necesario para las carpetas de imágenes)
        if (isNew) {
            product = productRepository.save(product);
        }

        // 3. ORQUESTACIÓN DE IMÁGENES
        String tenantSchema = TenantContext.getCurrentTenant();

        // A. Eliminar imágenes físicas que el usuario borró en la edición
        if (!isNew && product.getImages() != null) {
            List<String> existingUrlsFromDto = dto.getExistingImages() != null ? dto.getExistingImages() : new ArrayList<>();
            for (ProductImage oldImage : product.getImages()) {
                if (!existingUrlsFromDto.contains(oldImage.getFilePath())) {
                    imageStorageService.deletePhysicalImage(oldImage.getFilePath());
                }
            }
            product.getImages().clear(); // Limpiamos la colección actual, el orphanRemoval se encarga de la BD
        } else if (product.getImages() == null) {
            product.setImages(new ArrayList<>());
        }

        // B. Guardar nuevas imágenes físicamente y convertirlas a WebP
        Map<String, String> newUploadedUrls = imageStorageService.saveProductImages(tenantSchema, product.getId(), dto.getNewImages());

        // C. Reconstruir la colección de imágenes con el orden exacto (Drag & Drop)
        if (dto.getImageOrder() != null) {
            int position = 0;
            for (String ref : dto.getImageOrder()) {
                // Si la referencia es un archivo nuevo, buscamos su nueva URL pública
                String finalUrl = newUploadedUrls.containsKey(ref) ? newUploadedUrls.get(ref) : ref;

                // Determinar si es la principal
                boolean isPrimary = false;
                if (dto.getMainImageRef() != null && (dto.getMainImageRef().equals(ref) || dto.getMainImageRef().equals(finalUrl))) {
                    isPrimary = true;
                }

                // Extraer nombre del archivo de la URL
                String fileName = finalUrl.substring(finalUrl.lastIndexOf("/") + 1);

                ProductImage imgEntity = ProductImage.builder()
                        .product(product)
                        .fileName(fileName)
                        .filePath(finalUrl)
                        .isPrimary(isPrimary)
                        .sortPosition(position++)
                        .build();

                product.getImages().add(imgEntity);
            }
        }

        // Si no hay ninguna imagen principal definida por error, marcamos la primera por defecto
        if (!product.getImages().isEmpty() && product.getImages().stream().noneMatch(ProductImage::getIsPrimary)) {
            product.getImages().get(0).setIsPrimary(true);
        }

        productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        product.setIsDeleted(true);
        product.setIsActive(false);
        productRepository.save(product);
    }

    @Transactional
    public void restoreProduct(Long id) {
        Product product = getProductById(id);
        product.setIsDeleted(false);
        productRepository.save(product);
    }

    @Transactional
    public void hardDeleteProduct(Long id) {
        String tenantSchema = TenantContext.getCurrentTenant();
        imageStorageService.deleteProductFolder(tenantSchema, id); // Limpia los archivos físicos primero
        productRepository.deleteById(id); // Destruye la BD
    }

    @Transactional
    public boolean toggleStatus(Long id) {
        Product product = getProductById(id);
        product.setIsActive(!product.getIsActive());
        productRepository.save(product);
        return product.getIsActive();
    }

    public Page<Product> searchProducts(String q, Long categoryId, Boolean isActive, Boolean isDeleted, String sortStr, Pageable pageable) {
        Sort sort;
        switch (sortStr) {
            case "price_asc": sort = Sort.by("price").ascending(); break;
            case "price_desc": sort = Sort.by("price").descending(); break;
            case "stock_asc": sort = Sort.by("stock").ascending(); break;
            case "newest":
            default: sort = Sort.by("id").descending(); break;
        }

        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        List<Long> categoryIds = (categoryId != null) ? categoryService.getCategoryAndDescendantIds(categoryId) : null;
        return productRepository.searchProducts(q, categoryIds, isActive, isDeleted, sortedPageable);
    }
}