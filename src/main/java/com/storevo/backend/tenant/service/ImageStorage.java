package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.ImageMetadataDto;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface ImageStorage {

    // --- Centralización de Constantes Configurables ---
    int MAX_IMAGES_PER_PRODUCT = 10;
    long MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
    int MAX_IMAGE_WIDTH = 1600;
    int MAX_IMAGE_HEIGHT = 1600;
    int THUMB_WIDTH = 400;
    int THUMB_HEIGHT = 400;
    float IMAGE_QUALITY = 0.85f;
    String THUMB_SUFFIX = "_thumb";

    List<ImageMetadataDto> saveImages(String tenantSchema, List<MultipartFile> files);
    void deleteImage(String publicUrl);
    void deleteImages(List<String> publicUrls);
}