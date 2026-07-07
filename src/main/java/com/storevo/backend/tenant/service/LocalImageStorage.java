package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.ImageMetadataDto;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class LocalImageStorage implements ImageStorage {

    private static final String BASE_UPLOAD_DIR = "uploads";
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList("image/jpeg", "image/png", "image/webp");
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "webp");

    @Override
    public List<ImageMetadataDto> saveImages(String tenantSchema, List<MultipartFile> files) {
        List<ImageMetadataDto> metadataList = new ArrayList<>();
        if (files == null || files.isEmpty()) return metadataList;

        String dirPath = BASE_UPLOAD_DIR + "/tienda-" + tenantSchema + "/productos";
        Path storeDir = Paths.get(dirPath);

        try {
            if (!Files.exists(storeDir)) {
                Files.createDirectories(storeDir);
            }

            // Inicializar el motor criptográfico para el Hash
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            for (MultipartFile file : files) {
                if (file.isEmpty() || file.getOriginalFilename() == null) continue;

                // 1. Auditoría de Validaciones Backend
                if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
                    throw new RuntimeException("La imagen " + file.getOriginalFilename() + " supera el límite de 10MB.");
                }
                if (!ALLOWED_MIME_TYPES.contains(file.getContentType())) {
                    throw new RuntimeException("El tipo MIME no está permitido: " + file.getContentType());
                }

                String ext = file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf('.') + 1).toLowerCase();
                if (!ALLOWED_EXTENSIONS.contains(ext)) {
                    throw new RuntimeException("Extensión de archivo no permitida: " + ext);
                }

                // 2. Extraer archivo a memoria (Para dimensiones sin volver a leer el stream)
                BufferedImage originalImage = ImageIO.read(file.getInputStream());
                if (originalImage == null) {
                    throw new RuntimeException("El archivo proporcionado no es una imagen válida o está corrupto.");
                }

                // 3. Obtener Metadatos Críticos
                int imgWidth = originalImage.getWidth();
                int imgHeight = originalImage.getHeight();

                byte[] hashBytes = digest.digest(file.getBytes());
                StringBuilder hexString = new StringBuilder();
                for (byte b : hashBytes) {
                    String hex = Integer.toHexString(0xff & b);
                    if (hex.length() == 1) hexString.append('0');
                    hexString.append(hex);
                }
                String fileHash = hexString.toString();

                // 4. Procesamiento
                String baseUuid = UUID.randomUUID().toString();
                String mainFilename = baseUuid + ".webp";
                String thumbFilename = baseUuid + THUMB_SUFFIX + ".webp";

                File mainFile = new File(storeDir.toFile(), mainFilename);
                File thumbFile = new File(storeDir.toFile(), thumbFilename);

                // Como ya tenemos el BufferedImage en memoria, el procesamiento es ultra rápido
                Thumbnails.of(originalImage)
                        .size(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT)
                        .outputFormat("webp")
                        .outputQuality(IMAGE_QUALITY)
                        .toFile(mainFile);

                Thumbnails.of(originalImage)
                        .size(THUMB_WIDTH, THUMB_HEIGHT)
                        .outputFormat("webp")
                        .outputQuality(IMAGE_QUALITY)
                        .toFile(thumbFile);

                String publicDir = "/uploads/tienda-" + tenantSchema + "/productos/";

                metadataList.add(ImageMetadataDto.builder()
                        .originalFilename(file.getOriginalFilename())
                        .newFilename(mainFilename)
                        .publicUrl(publicDir + mainFilename)
                        .sizeBytes(file.getSize())
                        .mimeType(file.getContentType())
                        .fileHash(fileHash)
                        .width(imgWidth)
                        .height(imgHeight)
                        .build());
            }
        } catch (IOException | NoSuchAlgorithmException e) {
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
            if (relativePath.endsWith(".webp") && !relativePath.contains(THUMB_SUFFIX)) {
                String thumbPath = relativePath.replace(".webp", THUMB_SUFFIX + ".webp");
                Files.deleteIfExists(Paths.get(thumbPath));
            }
        } catch (IOException e) {
            System.err.println("Advertencia: No se pudo eliminar el archivo: " + relativePath);
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