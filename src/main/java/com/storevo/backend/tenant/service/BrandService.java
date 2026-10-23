package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.model.Brand;
import com.storevo.backend.tenant.repository.BrandRepository;
import com.storevo.backend.tenant.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BrandService {

    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;

    /** "Nike Air!" -> "nike-air" (sin tildes, minúsculas, solo letras y números). */
    public static String slugify(String raw) {
        if (raw == null) return "";
        String s = Normalizer.normalize(raw, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        return s.length() > 120 ? s.substring(0, 120) : s;
    }

    private static String cleanName(String raw) {
        if (raw == null) return "";
        String clean = raw.trim().replaceAll("\\s+", " ");
        if (clean.length() > 100) clean = clean.substring(0, 100).trim();
        return clean;
    }

    @Transactional(readOnly = true)
    public List<Brand> getAllBrands() {
        return brandRepository.findAllByOrderByNameAsc();
    }

    /** Cantidad de productos (no eliminados) por id de marca. */
    @Transactional(readOnly = true)
    public Map<Long, Long> getProductCountsByBrand() {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : productRepository.countProductsGroupedByBrand()) {
            counts.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        }
        return counts;
    }

    /** Devuelve la marca oficial (la crea si no existe). Null si el texto viene vacío. */
    @Transactional
    public Brand resolveOrCreate(String rawName) {
        String clean = cleanName(rawName);
        if (clean.isEmpty()) return null;

        String slug = slugify(clean);
        if (slug.isEmpty()) return null;

        final String finalName = clean;
        return brandRepository.findBySlug(slug).orElseGet(() ->
                brandRepository.save(Brand.builder().name(finalName).slug(slug).isActive(true).build()));
    }

    @Transactional
    public Brand create(String rawName) {
        String clean = cleanName(rawName);
        if (clean.isEmpty()) throw new IllegalArgumentException("Escribe el nombre de la marca.");
        String slug = slugify(clean);
        if (slug.isEmpty()) throw new IllegalArgumentException("El nombre debe contener letras o números.");
        if (brandRepository.findBySlug(slug).isPresent()) {
            throw new IllegalArgumentException("Esa marca ya existe.");
        }
        return brandRepository.save(Brand.builder().name(clean).slug(slug).isActive(true).build());
    }

    @Transactional
    public Brand update(Long id, String rawName, boolean active, String newLogoUrl, boolean removeLogo) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Marca no encontrada."));

        String clean = cleanName(rawName);
        if (clean.isEmpty()) throw new IllegalArgumentException("El nombre de la marca no puede estar vacío.");
        String slug = slugify(clean);
        if (slug.isEmpty()) throw new IllegalArgumentException("El nombre debe contener letras o números.");

        Brand clash = brandRepository.findBySlug(slug).orElse(null);
        if (clash != null && !clash.getId().equals(id)) {
            throw new IllegalArgumentException("Ya existe una marca llamada \"" + clash.getName() + "\".");
        }

        boolean nameChanged = !clean.equals(brand.getName());
        brand.setName(clean);
        brand.setSlug(slug);
        brand.setIsActive(active);

        if (newLogoUrl != null && !newLogoUrl.isBlank()) {
            brand.setLogoUrl(newLogoUrl);
        } else if (removeLogo) {
            brand.setLogoUrl(null);
        }

        brand = brandRepository.save(brand);
        if (nameChanged) {
            productRepository.syncBrandName(brand, clean); // mantiene products.brand al día
        }
        return brand;
    }

    @Transactional
    public void delete(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Marca no encontrada."));
        long inUse = productRepository.countActiveByBrand(id);
        if (inUse > 0) {
            throw new IllegalArgumentException("No puedes eliminar \"" + brand.getName() + "\": la usan "
                    + inUse + " producto(s). Cámbiales la marca primero.");
        }
        productRepository.clearBrand(brand); // limpia referencias en productos de la papelera
        brandRepository.delete(brand);
    }
}