package com.storevo.backend.tenant.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public Map<String, String> uploadImage(MultipartFile file, String tenantSlug) throws IOException {
        String folderPath = "storevo/" + tenantSlug + "/products";

        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", folderPath,
                "resource_type", "image"
        ));

        Map<String, String> result = new HashMap<>();
        result.put("secure_url", uploadResult.get("secure_url").toString());
        result.put("public_id", uploadResult.get("public_id").toString());

        return result;
    }

    public boolean deleteImage(String publicId) {
        if (publicId == null || publicId.isEmpty()) return false;
        try {
            Map result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            return "ok".equals(result.get("result"));
        } catch (IOException e) {
            log.error("Error al eliminar imagen de Cloudinary: {}", publicId, e);
            return false;
        }
    }
}