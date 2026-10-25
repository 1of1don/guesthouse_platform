package com.guesthub.image;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.guesthub.common.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;
    private final boolean configured;

    public CloudinaryService(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}") String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret) {
        this.configured = cloudName != null && !cloudName.isBlank();
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret));
    }

    // Returns the hosted image URL stored in the database.
    // If Cloudinary keys are not configured yet, image upload is skipped
    // so the rest of the API still works.
    public String upload(byte[] bytes, String folder) {
        if (!configured) return null;
        try {
            Map<?, ?> result = cloudinary.uploader().upload(bytes, ObjectUtils.asMap("folder", folder));
            return (String) result.get("secure_url");
        } catch (IOException e) {
            throw new ApiException(500, "Image upload failed: " + e.getMessage());
        }
    }
}
