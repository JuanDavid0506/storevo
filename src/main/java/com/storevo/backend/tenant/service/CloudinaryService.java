package com.storevo.backend.tenant.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.storevo.backend.config.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private static final long MAX_IMAGE_SIZE_BYTES = ImageStorage.MAX_IMAGE_SIZE_BYTES; // 10 MB
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");

    private final Cloudinary cloudinary;

    public Map<String, String> uploadImage(MultipartFile file, String tenantSlug) throws IOException {
        byte[] fileBytes = validateAndReadImageBytes(file);

        String cleanTenantPath = sanitizeTenantFolder(tenantSlug);
        String folderPath = "storevo/" + cleanTenantPath + "/products";

        Map uploadResult = cloudinary.uploader().upload(fileBytes, ObjectUtils.asMap(
                "folder", folderPath,
                "resource_type", "image"
        ));

        Map<String, String> result = new HashMap<>();
        result.put("secure_url", uploadResult.get("secure_url").toString());
        result.put("public_id", uploadResult.get("public_id").toString());

        return result;
    }

    public boolean deleteImage(String publicId) {
        return deleteImage(publicId, TenantContext.getCurrentTenant());
    }

    public boolean deleteImage(String publicId, String tenantIdentifier) {
        if (publicId == null || publicId.isBlank() || publicId.startsWith("legacy_image_")) {
            return false;
        }

        String baseTenant = extractBaseTenant(tenantIdentifier);
        if (baseTenant == null || baseTenant.isBlank() || TenantContext.DEFAULT_TENANT.equalsIgnoreCase(baseTenant)) {
            log.warn("Bloqueado intento de eliminar imagen '{}' sin contexto de tenant válido.", publicId);
            return false;
        }

        String expectedPrefix = "storevo/" + baseTenant + "/";
        if (!publicId.startsWith(expectedPrefix)) {
            log.warn("Bloqueado intento de eliminar imagen '{}' que no pertenece al prefijo del tenant '{}'.", publicId, expectedPrefix);
            return false;
        }

        try {
            Map result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            return "ok".equals(result.get("result"));
        } catch (IOException e) {
            log.error("Error al eliminar imagen de Cloudinary: {}", publicId, e);
            return false;
        }
    }

    private byte[] validateAndReadImageBytes(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo de imagen está vacío.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("El archivo de imagen no tiene un nombre válido.");
        }

        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new IllegalArgumentException("La imagen '" + originalFilename + "' supera el límite máximo de 10 MB.");
        }

        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase(Locale.ROOT).trim() : "";
        if (!ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Tipo de archivo no permitido (" + contentType + "). Solo se permiten imágenes JPG, PNG o WEBP.");
        }

        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == originalFilename.length() - 1) {
            throw new IllegalArgumentException("El archivo '" + originalFilename + "' no tiene una extensión válida.");
        }
        String ext = originalFilename.substring(dotIndex + 1).toLowerCase(Locale.ROOT).trim();
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("Extensión de archivo no permitida (." + ext + "). Usa .jpg, .jpeg, .png o .webp.");
        }

        byte[] bytes = file.getBytes();
        if (bytes.length == 0) {
            throw new IllegalArgumentException("El archivo de imagen está vacío.");
        }

        BufferedImage decodedImage = ImageIO.read(new ByteArrayInputStream(bytes));
        if (decodedImage != null) {
            if (decodedImage.getWidth() <= 0 || decodedImage.getHeight() <= 0) {
                throw new IllegalArgumentException("Las dimensiones de la imagen '" + originalFilename + "' no son válidas.");
            }
        } else if (!("image/webp".equals(contentType) && isValidWebpContainer(bytes))) {
            throw new IllegalArgumentException("El archivo '" + originalFilename + "' no es una imagen válida o está corrupto.");
        }

        return bytes;
    }

    /**
     * Verifica la firma binaria RIFF + WEBP (bytes 0..3 = "RIFF", bytes 8..11 = "WEBP")
     * para entornos donde ImageIO de la JVM no tenga registrado el plugin nativo de WebP.
     */
    private boolean isValidWebpContainer(byte[] bytes) {
        if (bytes == null || bytes.length < 16) {
            return false;
        }
        String riff = new String(bytes, 0, 4, StandardCharsets.US_ASCII);
        String webp = new String(bytes, 8, 4, StandardCharsets.US_ASCII);
        String vp8Chunk = new String(bytes, 12, 3, StandardCharsets.US_ASCII);
        return "RIFF".equals(riff) && "WEBP".equals(webp) && "VP8".equals(vp8Chunk);
    }

    private String sanitizeTenantFolder(String tenantSlug) {
        if (tenantSlug == null || tenantSlug.isBlank()) {
            String current = TenantContext.getCurrentTenant();
            if (current == null || current.isBlank() || TenantContext.DEFAULT_TENANT.equalsIgnoreCase(current)) {
                throw new IllegalStateException("No se pudo determinar el esquema de la tienda para subir la imagen.");
            }
            return current.trim();
        }
        String cleaned = tenantSlug.trim().replaceAll("^/+|/+$", "");
        if (cleaned.contains("..")) {
            throw new IllegalArgumentException("Ruta de carpeta de tienda inválida.");
        }
        return cleaned;
    }

    private String extractBaseTenant(String tenantIdentifier) {
        String source = (tenantIdentifier != null && !tenantIdentifier.isBlank())
                ? tenantIdentifier.trim()
                : TenantContext.getCurrentTenant();
        if (source == null || source.isBlank()) {
            return null;
        }
        String cleaned = source.replaceAll("^/+|/+$", "");
        int slashIdx = cleaned.indexOf('/');
        return slashIdx > 0 ? cleaned.substring(0, slashIdx) : cleaned;
    }
}