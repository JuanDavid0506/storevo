package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.ImageMetadataDto;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class LocalImageStorage implements ImageStorage {

    private static final String BASE_UPLOAD_DIR = "uploads";
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList("image/jpeg", "image/png", "image/webp", "image/jpg");

    @Override
    public List<ImageMetadataDto> saveImages(String tenantSchema, List<MultipartFile> files) {
        List<ImageMetadataDto> metadataList = new ArrayList<>();
        if (files == null || files.isEmpty()) return metadataList;

        // Estructura Plana: Ya no dependemos del ID del producto
        String dirPath = BASE_UPLOAD_DIR + "/tienda-" + tenantSchema + "/productos";
        Path storeDir = Paths.get(dirPath);

        try {
            if (!Files.exists(storeDir)) {
                Files.createDirectories(storeDir);
            }

            for (MultipartFile file : files) {
                if (file.isEmpty() || file.getOriginalFilename() == null) continue;

                // 1. Validaciones Backend Estrictas
                if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
                    throw new RuntimeException("La imagen " + file.getOriginalFilename() + " supera el límite de 10MB.");
                }
                if (!ALLOWED_MIME_TYPES.contains(file.getContentType())) {
                    throw new RuntimeException("Formato no soportado para: " + file.getOriginalFilename());
                }

                // 2. Nomenclatura (UUID)
                String baseUuid = UUID.randomUUID().toString();
                String mainFilename = baseUuid + ".webp";
                String thumbFilename = baseUuid + THUMB_SUFFIX + ".webp";

                File mainFile = new File(storeDir.toFile(), mainFilename);
                File thumbFile = new File(storeDir.toFile(), thumbFilename);

                // 3. Generar Versión Optimizada
                Thumbnails.of(file.getInputStream())
                        .size(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT)
                        .outputFormat("webp")
                        .outputQuality(IMAGE_QUALITY)
                        .toFile(mainFile);

                // 4. Generar Miniatura (Thumbnail)
                Thumbnails.of(file.getInputStream())
                        .size(THUMB_WIDTH, THUMB_HEIGHT)
                        .outputFormat("webp")
                        .outputQuality(IMAGE_QUALITY)
                        .toFile(thumbFile);

                // 5. Construcción del DTO
                String publicDir = "/uploads/tienda-" + tenantSchema + "/productos/";

                metadataList.add(ImageMetadataDto.builder()
                        .originalFilename(file.getOriginalFilename())
                        .newFilename(mainFilename)
                        .publicUrl(publicDir + mainFilename)
                        .sizeBytes(file.getSize())
                        .mimeType("image/webp")
                        .build());
            }
        } catch (IOException e) {
            throw new RuntimeException("Error crítico al procesar y guardar las imágenes físicas.", e);
        }

        return metadataList;
    }

    @Override
    public void deleteImage(String publicUrl) {
        if (publicUrl == null || !publicUrl.startsWith("/uploads/")) return;

        String relativePath = publicUrl.substring(1);
        try {
            Files.deleteIfExists(Paths.get(relativePath));

            // Borrar miniatura derivando su ruta automáticamente
            if (relativePath.endsWith(".webp") && !relativePath.contains(THUMB_SUFFIX)) {
                String thumbPath = relativePath.replace(".webp", THUMB_SUFFIX + ".webp");
                Files.deleteIfExists(Paths.get(thumbPath));
            }
        } catch (IOException e) {
            System.err.println("Advertencia: No se pudo eliminar el archivo físico: " + relativePath);
        }
    }

    @Override
    public void deleteImages(List<String> publicUrls) {
        if (publicUrls != null) {
            for (String url : publicUrls) {
                deleteImage(url);
            }
        }
    }
}