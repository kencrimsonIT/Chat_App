package com.messapp.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {
    @Autowired
    private Cloudinary cloudinary;

    /**
     * Upload a file to Cloudinary with automatic resource type detection.
     * Images use "image" resource type, other files use "raw".
     *
     * @param file the file to upload
     * @return map containing url, public_id, format, bytes, etc.
     */
    public Map upload(MultipartFile file) throws IOException {
        return upload(file, detectResourceType(file.getContentType()));
    }

    /**
     * Upload a file to Cloudinary with a specific resource type.
     *
     * @param file the file to upload
     * @param resourceType the Cloudinary resource type ("image", "raw", "video", "auto")
     * @return map containing url, public_id, format, bytes, etc.
     */
    public Map upload(MultipartFile file, String resourceType) throws IOException {
        Map<String, Object> params = ObjectUtils.asMap(
                "resource_type", resourceType
        );
        return cloudinary.uploader().upload(file.getBytes(), params);
    }

    /**
     * Detect the best Cloudinary resource type from a MIME type.
     */
    private String detectResourceType(String mimeType) {
        if (mimeType == null) return "raw";
        if (mimeType.startsWith("image/")) return "image";
        if (mimeType.startsWith("video/")) return "video";
        return "raw";
    }
}
