package com.storevo.backend.tenant.service;

import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.ImageMetadataDto;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;
    private final ImageStorage imageStorage; // Inyectando la Interfaz Pura

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

        // 2. Validación de Límites Backend
        int existingCount = dto.getExistingImages() != null ? dto.getExistingImages().size() : 0;
        int newCount = (dto.getNewImages() != null && !dto.getNewImages().isEmpty() && dto.getNewImages().get(0).getSize() > 0) ? dto.getNewImages().size() : 0;

        if ((existingCount + newCount) > ImageStorage.MAX_IMAGES_PER_PRODUCT) {
            throw new RuntimeException("Límite excedido. Un producto solo puede tener " + ImageStorage.MAX_IMAGES_PER_PRODUCT + " imágenes.");
        }

        if (isNew) {
            product = productRepository.save(product);
        }

        // 4. ORQUESTACIÓN DE IMÁGENES
        String tenantSchema = TenantContext.getCurrentTenant();
        List<String> existingUrlsFromDto = dto.getExistingImages() != null ? dto.getExistingImages() : new ArrayList<>();
        List<ProductImage> oldImagesList = product.getImages() != null ? new ArrayList<>(product.getImages()) : new ArrayList<>();

        if (product.getImages() == null) product.setImages(new ArrayList<>());

        for (ProductImage oldImg : oldImagesList) {
            if (!existingUrlsFromDto.contains(oldImg.getFilePath())) {
                imageStorage.deleteImage(oldImg.getFilePath());
            }
        }
        product.getImages().clear();

        List<ImageMetadataDto> newMetadataList = imageStorage.saveImages(tenantSchema, dto.getNewImages());

        Map<String, ImageMetadataDto> newImagesMap = new HashMap<>();
        for(ImageMetadataDto meta : newMetadataList) {
            newImagesMap.put(meta.getOriginalFilename(), meta);
        }

        if (dto.getImageOrder() != null) {
            int position = 0;
            for (String ref : dto.getImageOrder()) {

                boolean isPrimary = false;
                ProductImage imgEntity = null;

                if (existingUrlsFromDto.contains(ref)) {
                    if (dto.getMainImageRef() != null && dto.getMainImageRef().equals(ref)) isPrimary = true;

                    ProductImage oldMatch = oldImagesList.stream()
                            .filter(img -> img.getFilePath().equals(ref)).findFirst().orElse(null);

                    if (oldMatch != null) {
                        imgEntity = ProductImage.builder()
                                .product(product)
                                .fileName(oldMatch.getFileName())
                                .originalFileName(oldMatch.getOriginalFileName()) // Mantiene el original
                                .filePath(oldMatch.getFilePath())
                                .fileHash(oldMatch.getFileHash())
                                .width(oldMatch.getWidth())
                                .height(oldMatch.getHeight())
                                .mimeType(oldMatch.getMimeType())
                                .fileSize(oldMatch.getFileSize())
                                .aiTags(oldMatch.getAiTags())       // Mantiene los tags de IA si los hay
                                .altText(oldMatch.getAltText())     // Mantiene el texto alternativo
                                .variantId(oldMatch.getVariantId())
                                .isPrimary(isPrimary)
                                .sortPosition(position++)
                                .build();
                    }
                } else if (newImagesMap.containsKey(ref)) {
                    ImageMetadataDto meta = newImagesMap.get(ref);

                    if (dto.getMainImageRef() != null && (dto.getMainImageRef().equals(ref) || dto.getMainImageRef().equals(meta.getPublicUrl()))) {
                        isPrimary = true;
                    }

                    imgEntity = ProductImage.builder()
                            .product(product)
                            .fileName(meta.getNewFilename())
                            .originalFileName(meta.getOriginalFilename()) // NUEVO: Extraído del procesador
                            .filePath(meta.getPublicUrl())
                            .fileHash(meta.getFileHash())
                            .width(meta.getWidth())
                            .height(meta.getHeight())
                            .mimeType(meta.getMimeType())
                            .fileSize(meta.getSizeBytes())
                            .isPrimary(isPrimary)
                            .sortPosition(position++)
                            .build();
                }

                if (imgEntity != null) {
                    product.getImages().add(imgEntity);
                }
            }
        }

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
        Product product = getProductById(id);
        // Borrar archivos uno por uno
        List<String> urlsToDelete = product.getImages().stream()
                .map(ProductImage::getFilePath).collect(Collectors.toList());
        imageStorage.deleteImages(urlsToDelete);

        productRepository.deleteById(id);
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