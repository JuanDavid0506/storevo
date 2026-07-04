package com.storevo.backend.tenant.service;

import net.coobird.thumbnailator.Thumbnails;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ImageStorageService {

    private static final String BASE_UPLOAD_DIR = "uploads";
    private static final int MAX_WIDTH = 1600;
    private static final int MAX_HEIGHT = 1600;
    private static final float IMAGE_QUALITY = 0.85f; // Constante configurable de calidad (85%)

    /**
     * Comprime, redimensiona y convierte a WebP las imágenes físicas.
     * Retorna un mapa: Key = Nombre original (para sincronizar con el frontend), Value = URL pública del nuevo archivo.
     */
    public Map<String, String> saveProductImages(String tenantSchema, Long productId, List<MultipartFile> files) {
        Map<String, String> uploadedUrls = new HashMap<>();

        if (files == null || files.isEmpty()) return uploadedUrls;

        // Carpeta física: uploads/tienda-{tenant}/productos/{id}/
        String dirPath = BASE_UPLOAD_DIR + "/" + tenantSchema + "/productos/" + productId;
        Path productDir = Paths.get(dirPath);

        try {
            if (!Files.exists(productDir)) {
                Files.createDirectories(productDir);
            }

            for (MultipartFile file : files) {
                if (file.isEmpty() || file.getOriginalFilename() == null) continue;

                // 1. Usar UUID para evitar colisiones y preparar para AWS S3/Cloudflare R2
                String newFilename = UUID.randomUUID().toString() + ".webp";
                File targetFile = new File(productDir.toFile(), newFilename);

                // 2. Motor Thumbnailator: Redimensiona a 1600px y comprime a WebP
                Thumbnails.of(file.getInputStream())
                        .size(MAX_WIDTH, MAX_HEIGHT)
                        .outputFormat("webp")
                        .outputQuality(IMAGE_QUALITY)
                        .toFile(targetFile);

                // 3. Generar URL Pública que se guardará en la BD
                String publicUrl = "/uploads/" + tenantSchema + "/productos/" + productId + "/" + newFilename;
                uploadedUrls.put(file.getOriginalFilename(), publicUrl);
            }
        } catch (IOException e) {
            throw new RuntimeException("Error crítico al procesar y guardar las imágenes físicas.", e);
        }

        return uploadedUrls;
    }

    /**
     * Elimina físicamente un archivo del servidor.
     * Se llama cuando el administrador borra una imagen individual al editar un producto.
     */
    public void deletePhysicalImage(String publicUrl) {
        if (publicUrl == null || !publicUrl.startsWith("/uploads/")) return;

        // Quitar el primer "/" para que coincida con la ruta relativa del sistema de archivos
        String relativePath = publicUrl.substring(1);
        try {
            Files.deleteIfExists(Paths.get(relativePath));
        } catch (IOException e) {
            System.err.println("Advertencia: No se pudo eliminar el archivo físico: " + relativePath);
        }
    }

    /**
     * Elimina la carpeta entera de un producto.
     * Se llama desde ProductService durante el "Hard Delete" para no dejar archivos basura en el disco.
     */
    public void deleteProductFolder(String tenantSchema, Long productId) {
        String dirPath = BASE_UPLOAD_DIR + "/" + tenantSchema + "/productos/" + productId;
        File dir = new File(dirPath);
        if (dir.exists() && dir.isDirectory()) {
            File[] files = dir.listFiles();
            if (files != null) {
                for (File file : files) {
                    file.delete(); // Borrar imágenes una por una
                }
            }
            dir.delete(); // Borrar la carpeta del producto
        }
    }
}