package com.storevo.backend.tenant.service;

import com.cloudinary.Cloudinary;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.ProductDto;
import com.storevo.backend.tenant.model.*;
import com.storevo.backend.tenant.repository.CategoryRepository;
import com.storevo.backend.tenant.repository.ProductRepository;

import groovy.util.logging.Slf4j;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {
    private static final Logger log = LoggerFactory.getLogger(CloudinaryService.class);
    private final Cloudinary cloudinary;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;
    private final CloudinaryService cloudinaryService;

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

    @Transactional(readOnly = true)
    public Product getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        if (product.getHasVariants() != null && product.getHasVariants()) {
            product.getOptions().size();
            for (ProductOption opt : product.getOptions()) {
                opt.getValues().size();
            }

            product.getVariantsList().size();
            for (ProductVariant var : product.getVariantsList()) {
                var.getImages().size();
            }
        }

        return product;
    }

    @Transactional
    public void saveProduct(ProductDto dto) {
        if (dto.getSku() == null || dto.getSku().trim().isEmpty()) {
            long nextNumber = productRepository.findTopByOrderByIdDesc()
                    .map(p -> p.getId() + 1)
                    .orElse(1L);
            dto.setSku(String.format("PROD-%04d", nextNumber));
        }

        if (Boolean.TRUE.equals(dto.getHasVariants()) && dto.getVariants() != null) {
            int variantCounter = 1;
            for (ProductDto.VariantDto variant : dto.getVariants()) {
                if (variant.getSku() == null || variant.getSku().trim().isEmpty()) {
                    variant.setSku(dto.getSku() + "-" + variantCounter);
                }
                variantCounter++;
            }
        }

        Product product;
        boolean isNew = dto.getId() == null;

        if (!isNew) {
            product = getProductById(dto.getId());
        } else {
            product = new Product();
        }

        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setBrand(dto.getBrand());
        product.setSku(dto.getSku());
        product.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : false);
        product.setHasVariants(dto.getHasVariants() != null ? dto.getHasVariants() : false);

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

        if (!product.getHasVariants()) {
            product.setPrice(dto.getPrice() != null ? dto.getPrice() : 0.0);
            product.setDiscountPrice(dto.getDiscountPrice());
            product.setStock(dto.getStock() != null ? dto.getStock() : 0);
            product.setWeight(dto.getWeight());

            product.getOptions().clear();
            product.getVariantsList().clear();
        } else {
            if (isNew) {
                product.setPrice(0.0);
                product.setStock(0);
            }
        }

        int existingCount = dto.getExistingImages() != null ? dto.getExistingImages().size() : 0;
        int newCount = (dto.getNewImages() != null && !dto.getNewImages().isEmpty() && dto.getNewImages().get(0).getSize() > 0) ? dto.getNewImages().size() : 0;
        if ((existingCount + newCount) > 10) {
            throw new RuntimeException("Límite excedido. Un producto solo puede tener 10 imágenes.");
        }

        if (isNew) {
            product = productRepository.save(product);
        }

        // ---- MANEJO DE IMÁGENES CON CLOUDINARY ----
        String tenantSchema = TenantContext.getCurrentTenant();
        List<String> existingUrlsFromDto = dto.getExistingImages() != null ? dto.getExistingImages() : new ArrayList<>();
        List<ProductImage> oldImagesList = product.getImages() != null ? new ArrayList<>(product.getImages()) : new ArrayList<>();
        if (product.getImages() == null) product.setImages(new ArrayList<>());

        // Eliminar de Cloudinary las que ya no están en el DTO
        for (ProductImage oldImg : oldImagesList) {
            if (!existingUrlsFromDto.contains(oldImg.getSecureUrl())) {
                cloudinaryService.deleteImage(oldImg.getPublicId());
            }
        }
        product.getImages().clear();

        // Subir las nuevas imágenes
        Map<String, Map<String, String>> newImagesMap = new HashMap<>();
        if (dto.getNewImages() != null && !dto.getNewImages().isEmpty() && dto.getNewImages().get(0).getSize() > 0) {
            for (MultipartFile file : dto.getNewImages()) {
                try {
                    Map<String, String> uploadResult = cloudinaryService.uploadImage(file, tenantSchema);
                    // Mapeamos el nombre original del frontend con el resultado seguro de Cloudinary
                    newImagesMap.put(file.getOriginalFilename(), uploadResult);
                } catch (IOException e) {
                    log.error("Fallo al subir imagen a Cloudinary", e);
                }
            }
        }

        if (dto.getImageOrder() != null) {
            int position = 0;
            for (String ref : dto.getImageOrder()) {
                boolean isPrimary = false;
                ProductImage imgEntity = null;

                if (existingUrlsFromDto.contains(ref)) {
                    if (dto.getMainImageRef() != null && dto.getMainImageRef().equals(ref)) isPrimary = true;
                    ProductImage oldMatch = oldImagesList.stream().filter(img -> img.getSecureUrl().equals(ref)).findFirst().orElse(null);

                    if (oldMatch != null) {
                        // 1. REUTILIZAMOS LA ENTIDAD (Para que Hibernate haga UPDATE y no DELETE+INSERT)
                        oldMatch.setIsPrimary(isPrimary);
                        oldMatch.setSortPosition(position++);
                        oldMatch.setVariantId(null);

                        // 2. FIX: Si es una imagen vieja pre-Cloudinary, le ponemos un ID genérico para que no explote
                        if (oldMatch.getPublicId() == null) {
                            oldMatch.setPublicId("legacy_image_" + UUID.randomUUID().toString().substring(0, 8));
                        }

                        imgEntity = oldMatch;
                    }
                } else if (newImagesMap.containsKey(ref)) {
                    Map<String, String> meta = newImagesMap.get(ref);
                    String secureUrl = meta.get("secure_url");
                    if (dto.getMainImageRef() != null && (dto.getMainImageRef().equals(ref) || dto.getMainImageRef().equals(secureUrl))) {
                        isPrimary = true;
                    }
                    imgEntity = ProductImage.builder()
                            .product(product)
                            .secureUrl(secureUrl)
                            .publicId(meta.get("public_id"))
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

        // ---- MANEJO DE VARIANTES ----
        if (product.getHasVariants() && dto.getOptions() != null && dto.getVariants() != null) {

            Map<String, ProductVariant> existingVariants = new HashMap<>();
            for (ProductVariant oldVar : product.getVariantsList()) {
                if (oldVar.getOptionValues() != null && !oldVar.getOptionValues().isEmpty()) {
                    String sig = oldVar.getOptionValues().stream()
                            .map(ov -> ov.getOption().getName() + ":" + ov.getValueName())
                            .sorted()
                            .collect(Collectors.joining("|"));
                    existingVariants.put(sig, oldVar);
                }
            }

            List<ProductOption> newOptions = new ArrayList<>();
            Map<String, ProductOptionValue> optionValueLookup = new HashMap<>();

            int optPos = 0;
            for (ProductDto.OptionDto optDto : dto.getOptions()) {
                ProductOption option = ProductOption.builder()
                        .product(product)
                        .name(optDto.getName())
                        .sortPosition(optPos++)
                        .build();

                List<ProductOptionValue> values = new ArrayList<>();
                int valPos = 0;
                for (String valName : optDto.getValues()) {
                    ProductOptionValue val = ProductOptionValue.builder()
                            .option(option)
                            .valueName(valName)
                            .sortPosition(valPos++)
                            .build();
                    values.add(val);
                    optionValueLookup.put(optDto.getName() + ":" + valName, val);
                }
                option.setValues(values);
                newOptions.add(option);
            }
            product.getOptions().clear();
            product.getOptions().addAll(newOptions);

            List<ProductVariant> newVariantsList = new ArrayList<>();
            double minPrice = Double.MAX_VALUE;
            int totalStock = 0;

            for (ProductDto.VariantDto varDto : dto.getVariants()) {
                if (varDto.getCombination() == null || varDto.getCombination().isEmpty()) continue;

                String sig = varDto.getCombination().entrySet().stream()
                        .map(e -> e.getKey() + ":" + e.getValue())
                        .sorted()
                        .collect(Collectors.joining("|"));

                ProductVariant variant = existingVariants.get(sig);
                if (variant == null) {
                    variant = new ProductVariant();
                    variant.setProduct(product);
                }

                variant.setSku(varDto.getSku());
                variant.setBarcode(varDto.getBarcode());
                variant.setPrice(varDto.getPrice() != null ? varDto.getPrice() : 0.0);
                variant.setStock(varDto.getStock() != null ? varDto.getStock() : 0);
                variant.setWeight(varDto.getWeight());

                List<ProductOptionValue> linkedValues = new ArrayList<>();
                for (Map.Entry<String, String> entry : varDto.getCombination().entrySet()) {
                    ProductOptionValue pov = optionValueLookup.get(entry.getKey() + ":" + entry.getValue());
                    if (pov != null) linkedValues.add(pov);
                }
                variant.setOptionValues(linkedValues);

                newVariantsList.add(variant);

                if (variant.getPrice() < minPrice) minPrice = variant.getPrice();
                totalStock += variant.getStock();
            }

            product.getVariantsList().clear();
            product.getVariantsList().addAll(newVariantsList);

            product.setPrice(minPrice == Double.MAX_VALUE ? 0.0 : minPrice);
            product.setStock(totalStock);
        }

        product = productRepository.save(product);

        if (product.getHasVariants() && dto.getVariants() != null) {
            List<ProductDto.VariantDto> validDtos = dto.getVariants().stream()
                    .filter(v -> v.getCombination() != null && !v.getCombination().isEmpty())
                    .collect(Collectors.toList());

            for (ProductDto.VariantDto vDto : validDtos) {
                if (vDto.getImageRef() != null && !vDto.getImageRef().isEmpty()) {
                    String sig = vDto.getCombination().entrySet().stream()
                            .map(e -> e.getKey() + ":" + e.getValue())
                            .sorted()
                            .collect(Collectors.joining("|"));

                    ProductVariant savedVariant = product.getVariantsList().stream()
                            .filter(v -> {
                                String vSig = v.getOptionValues().stream()
                                        .map(ov -> ov.getOption().getName() + ":" + ov.getValueName())
                                        .sorted()
                                        .collect(Collectors.joining("|"));
                                return vSig.equals(sig);
                            }).findFirst().orElse(null);


                    if (savedVariant != null) {
                        List<String> targetImages = Arrays.asList(vDto.getImageRef().split(","));

                        product.getImages().stream()
                                .filter(img -> targetImages.contains(img.getSecureUrl()))
                                .forEach(img -> img.setVariantId(savedVariant.getId()));
                    }
                }
            }
            productRepository.save(product);
        }
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
        // Destruir imágenes en Cloudinary antes de borrar el producto de la DB
        product.getImages().forEach(img -> cloudinaryService.deleteImage(img.getPublicId()));
        productRepository.deleteById(id);
    }

    @Transactional
    public boolean toggleStatus(Long id) {
        Product product = getProductById(id);
        product.setIsActive(!product.getIsActive());
        productRepository.save(product);
        return product.getIsActive();
    }

    public Page<Product> searchProducts(String q, Long categoryId, Boolean isActive, Boolean isDeleted, String quick, String sortStr, Pageable pageable) {
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
        return productRepository.searchProducts(q, categoryIds, isActive, isDeleted, quick, sortedPageable);
    }

    @Transactional
    public void updateQuickStock(Long productId, Integer newStock) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));

        product.setStock(newStock);
        productRepository.save(product);
    }

    @Transactional
    public void executeMassAction(List<Long> ids, String action) {
        if (ids == null || ids.isEmpty()) return;

        List<Product> products = productRepository.findAllById(ids);
        for (Product p : products) {
            switch (action) {
                case "activate":
                    p.setIsActive(true);
                    p.setIsDeleted(false);
                    break;
                case "hide":
                    p.setIsActive(false);
                    break;
                case "delete":
                    p.setIsDeleted(true);
                    p.setIsActive(false);
                    break;
            }
        }
        productRepository.saveAll(products);
    }

    @Transactional(readOnly = true)
    public Map<Long, Map<String, Object>> getBulkStatistics(List<Long> productIds) {
        Map<Long, Map<String, Object>> statsMap = new HashMap<>();

        if (productIds == null || productIds.isEmpty()) return statsMap;

        for (Long id : productIds) {
            Map<String, Object> productStats = new HashMap<>();
            productStats.put("sold", 0);
            productStats.put("lastSale", "Sin ventas");
            statsMap.put(id, productStats);
        }

        return statsMap;
    }
}