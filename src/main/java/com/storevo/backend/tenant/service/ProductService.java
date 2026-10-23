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
    private final BrandService brandService;
    private final CloudinaryService cloudinaryService;

    @Transactional(readOnly = true)
    public ProductRepository.ProductCountsProjection getGlobalCounts() {
        return productRepository.countProductsByStatus();
    }

    @Transactional
    public Long createEmptyDraft() {
        Product draft = new Product();
        draft.setName("");
        draft.setIsActive(false);
        draft.setHasVariants(false);
        draft.setIsFeatured(false);
        draft.setStock(0);
        draft.setPrice(0.0);
        draft.setWeight(0.0);
        draft.setIsDraft(true);
        draft = productRepository.save(draft);
        return draft.getId();
    }

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
    public List<Product> getNewestPublicProducts(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 24));
        return productRepository.findActiveNewestProducts(PageRequest.of(0, safeLimit));
    }

    @Transactional(readOnly = true)
    public List<Product> getOfferPublicProducts(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 24));
        return productRepository.findActiveOfferProducts(PageRequest.of(0, safeLimit));
    }

    @Transactional(readOnly = true)
    public List<Product> getPublicCatalogLimited(Long categoryId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 24));
        if (categoryId == null) {
            return getNewestPublicProducts(safeLimit);
        }
        List<Long> categoryIds = categoryService.getCategoryAndDescendantIds(categoryId);
        if (categoryIds == null || categoryIds.isEmpty()) {
            return Collections.emptyList();
        }
        return productRepository.findActiveProductsByCategoryIds(categoryIds, PageRequest.of(0, safeLimit));
    }

    @Transactional(readOnly = true)
    public List<Product> getPublicProductsByBrand(Long brandId, String brandName, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 24));
        String resolvedName = (brandName != null && !brandName.isBlank()) ? brandName.trim() : null;
        Long resolvedId = brandId;

        if (resolvedId != null) {
            final Long targetId = resolvedId;
            Brand b = brandService.getAllBrands().stream()
                    .filter(item -> targetId.equals(item.getId()))
                    .findFirst()
                    .orElse(null);
            if (b == null || Boolean.FALSE.equals(b.getIsActive())) {
                return Collections.emptyList();
            }
            if (resolvedName == null) {
                resolvedName = b.getName();
            }
        } else if (resolvedName != null) {
            String targetSlug = BrandService.slugify(resolvedName);
            final String searchName = resolvedName;
            Brand b = brandService.getAllBrands().stream()
                    .filter(item -> targetSlug.equalsIgnoreCase(item.getSlug()) || searchName.equalsIgnoreCase(item.getName()))
                    .findFirst()
                    .orElse(null);
            if (b != null) {
                if (Boolean.FALSE.equals(b.getIsActive())) {
                    return Collections.emptyList();
                }
                resolvedId = b.getId();
                resolvedName = b.getName();
            }
        }

        if (resolvedId == null && (resolvedName == null || resolvedName.isEmpty())) {
            return Collections.emptyList();
        }
        return productRepository.findActiveProductsByBrand(resolvedId, resolvedName, PageRequest.of(0, safeLimit));
    }

    @Transactional(readOnly = true)
    public List<Product> getFeaturedPublicProducts(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 24));
        return productRepository.findActiveFeaturedProducts(PageRequest.of(0, safeLimit));
    }

    @Transactional(readOnly = true)
    public List<Product> getManualPublicProductsInOrder(List<Long> orderedIds, int limit) {
        if (orderedIds == null || orderedIds.isEmpty()) {
            return Collections.emptyList();
        }
        int safeLimit = Math.max(1, Math.min(limit, 24));
        List<Long> uniqueIds = orderedIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        if (uniqueIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Product> found = productRepository.findActivePublicProductsByIdIn(uniqueIds);
        Map<Long, Product> byId = new HashMap<>();
        for (Product p : found) {
            if (p != null && p.getId() != null) {
                byId.put(p.getId(), p);
            }
        }

        List<Product> ordered = new ArrayList<>();
        for (Long id : uniqueIds) {
            Product p = byId.get(id);
            if (p != null) {
                ordered.add(p);
                if (ordered.size() >= safeLimit) break;
            }
        }
        return ordered;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> searchProductsForEditorPicker(String query, List<Long> specificIds, int limit) {
        List<Product> results;
        if (specificIds != null && !specificIds.isEmpty()) {
            results = getManualPublicProductsInOrder(specificIds, Math.min(specificIds.size(), 50));
        } else {
            int safeLimit = Math.max(1, Math.min(limit, 30));
            String cleanQuery = (query != null && !query.isBlank()) ? query.trim() : null;
            results = productRepository.searchActiveProductsForPicker(cleanQuery, PageRequest.of(0, safeLimit));
        }

        List<Map<String, Object>> items = new ArrayList<>();
        for (Product p : results) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", p.getId());
            item.put("name", p.getName() != null ? p.getName() : "");
            item.put("sku", p.getSku() != null ? p.getSku() : "");
            item.put("brand", p.getBrand() != null ? p.getBrand() : "");
            item.put("price", p.getPrice() != null ? p.getPrice() : 0.0);
            item.put("discountPrice", p.getDiscountPrice());
            item.put("isFeatured", Boolean.TRUE.equals(p.getIsFeatured()));
            String img = p.getMainImageThumbnailUrl() != null ? p.getMainImageThumbnailUrl()
                    : (p.getMainImageUrl() != null ? p.getMainImageUrl() : "/img/placeholder.jpg");
            item.put("imageUrl", img);
            items.add(item);
        }
        return items;
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
        // --- MARCA: se normaliza contra la tabla de marcas (Nike = nike = NIKE) ---
        String rawBrand = dto.getBrand();
        if ((rawBrand == null || rawBrand.isBlank()) && dto.getAttrKeys() != null && dto.getAttrValues() != null) {
            for (int i = 0; i < dto.getAttrKeys().size() && i < dto.getAttrValues().size(); i++) {
                String k = dto.getAttrKeys().get(i);
                if (k != null && k.trim().equalsIgnoreCase("marca")) {
                    rawBrand = dto.getAttrValues().get(i);
                    break;
                }
            }
        }
        Brand brandEntity = brandService.resolveOrCreate(rawBrand);
        product.setBrandRef(brandEntity);
        product.setBrand(brandEntity != null ? brandEntity.getName() : null);
        product.setSku(dto.getSku());
        product.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : false);
        product.setHasVariants(dto.getHasVariants() != null ? dto.getHasVariants() : false);
        product.setIsMadeToOrder(dto.getIsMadeToOrder() != null ? dto.getIsMadeToOrder() : false);
        product.setIsDraft(dto.getIsDraft() != null ? dto.getIsDraft() : false);
        if (dto.getIsFeatured() != null) {
            product.setIsFeatured(dto.getIsFeatured());
        } else if (isNew || product.getIsFeatured() == null) {
            product.setIsFeatured(false);
        }

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

                String key = (k != null) ? k.trim() : "";
                String value = (v != null) ? v.trim() : "";
                if (key.equalsIgnoreCase("marca")) continue; // la marca ya no vive en la ficha técnica

                if (Boolean.TRUE.equals(product.getIsDraft())) {
                    attributes.put(key, value);
                } else {
                    if (!key.isEmpty() && !value.isEmpty()) {
                        attributes.put(key, value);
                    }
                }
            }
        }
        product.setAttributes(attributes.isEmpty() ? null : attributes);

        if (!product.getHasVariants()) {
            product.setPrice(dto.getPrice() != null ? dto.getPrice() : 0.0);
            product.setDiscountPrice(dto.getDiscountPrice());
            product.setStock(Boolean.TRUE.equals(product.getIsMadeToOrder()) ? 0 : (dto.getStock() != null ? dto.getStock() : 0));
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

        String tenantSchema = TenantContext.getCurrentTenant();
        List<String> existingUrlsFromDto = dto.getExistingImages() != null ? dto.getExistingImages() : new ArrayList<>();
        List<ProductImage> oldImagesList = product.getImages() != null ? new ArrayList<>(product.getImages()) : new ArrayList<>();
        if (product.getImages() == null) product.setImages(new ArrayList<>());

        for (ProductImage oldImg : oldImagesList) {
            if (!existingUrlsFromDto.contains(oldImg.getSecureUrl())) {
                cloudinaryService.deleteImage(oldImg.getPublicId());
            }
        }
        product.getImages().clear();

        Map<String, Map<String, String>> newImagesMap = new HashMap<>();
        if (dto.getNewImages() != null && !dto.getNewImages().isEmpty() && dto.getNewImages().get(0).getSize() > 0) {
            for (MultipartFile file : dto.getNewImages()) {
                try {
                    Map<String, String> uploadResult = cloudinaryService.uploadImage(file, tenantSchema);
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
                        oldMatch.setIsPrimary(isPrimary);
                        oldMatch.setSortPosition(position++);
                        oldMatch.setVariantId(null);

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

            Map<String, ProductOption> existingOptionsMap = new HashMap<>();
            if (product.getOptions() != null) {
                for (ProductOption opt : product.getOptions()) {
                    existingOptionsMap.put(opt.getName(), opt);
                }
            }

            List<ProductOption> newOptionsList = new ArrayList<>();
            Map<String, ProductOptionValue> optionValueLookup = new HashMap<>();

            int optPos = 0;
            for (ProductDto.OptionDto optDto : dto.getOptions()) {
                ProductOption option = existingOptionsMap.get(optDto.getName());
                if (option == null) {
                    option = ProductOption.builder()
                            .product(product)
                            .name(optDto.getName())
                            .build();
                    option.setValues(new ArrayList<>());
                }
                option.setSortPosition(optPos++);

                Map<String, ProductOptionValue> existingValuesMap = new HashMap<>();
                if (option.getValues() != null) {
                    for (ProductOptionValue val : option.getValues()) {
                        existingValuesMap.put(val.getValueName(), val);
                    }
                }

                List<ProductOptionValue> newValuesList = new ArrayList<>();
                int valPos = 0;
                for (String valName : optDto.getValues()) {
                    ProductOptionValue val = existingValuesMap.get(valName);
                    if (val == null) {
                        val = ProductOptionValue.builder()
                                .option(option)
                                .valueName(valName)
                                .build();
                    }
                    val.setSortPosition(valPos++);
                    newValuesList.add(val);
                    optionValueLookup.put(optDto.getName() + ":" + valName, val);
                }

                if(option.getValues() == null) {
                    option.setValues(newValuesList);
                } else {
                    option.getValues().clear();
                    option.getValues().addAll(newValuesList);
                }

                newOptionsList.add(option);
            }
            product.getOptions().clear();
            product.getOptions().addAll(newOptionsList);

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
                variant.setStock(Boolean.TRUE.equals(product.getIsMadeToOrder()) ? 0 : (varDto.getStock() != null ? varDto.getStock() : 0));
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

                        List<String> resolvedTargets = targetImages.stream()
                                .map(ref -> newImagesMap.containsKey(ref)
                                        ? newImagesMap.get(ref).get("secure_url")
                                        : ref)
                                .collect(Collectors.toList());

                        for (String targetUrl : resolvedTargets) {
                            ProductImage freeImg = product.getImages().stream()
                                    .filter(img -> targetUrl.equals(img.getSecureUrl()) && img.getVariantId() == null)
                                    .findFirst()
                                    .orElse(null);

                            if (freeImg != null) {
                                freeImg.setVariantId(savedVariant.getId());
                            } else {
                                ProductImage sourceImg = product.getImages().stream()
                                        .filter(img -> targetUrl.equals(img.getSecureUrl()))
                                        .findFirst()
                                        .orElse(null);

                                if (sourceImg != null) {
                                    ProductImage clone = ProductImage.builder()
                                            .product(product)
                                            .secureUrl(sourceImg.getSecureUrl())
                                            .publicId(sourceImg.getPublicId())
                                            .isPrimary(false)
                                            .sortPosition(sourceImg.getSortPosition())
                                            .variantId(savedVariant.getId())
                                            .build();
                                    product.getImages().add(clone);
                                }
                            }
                        }
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

    @Transactional
    public boolean toggleFeatured(Long id) {
        Product product = getProductById(id);
        boolean nextState = !Boolean.TRUE.equals(product.getIsFeatured());
        product.setIsFeatured(nextState);
        productRepository.save(product);
        return nextState;
    }

    public Page<Product> searchProducts(String q, Long categoryId, Boolean isActive, Boolean isDeleted, Boolean isDraft, String quick, String sortStr, Pageable pageable) {
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
        return productRepository.searchProducts(q, categoryIds, isActive, isDeleted, isDraft, quick, sortedPageable);
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
                case "feature":
                    p.setIsFeatured(true);
                    break;
                case "unfeature":
                    p.setIsFeatured(false);
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