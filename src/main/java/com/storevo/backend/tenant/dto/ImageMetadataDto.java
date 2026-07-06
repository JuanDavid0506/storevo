package com.storevo.backend.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageMetadataDto {
    private String originalFilename;
    private String newFilename;
    private String publicUrl;
    private Long sizeBytes;
    private String mimeType;
}