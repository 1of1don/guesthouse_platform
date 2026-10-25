package com.guesthub.guesthouse;

import org.springframework.web.multipart.MultipartFile;

// All fields nullable: "create" validates the required ones,
// "update" only patches whichever fields are present.
public record GuesthouseForm(
        String name,
        Double pricePerNight,
        String city,
        String country,
        String description,
        String amenities,   // "Wifi, Parking, Pool" or a JSON array string
        String contact,
        Double latitude,
        Double longitude,
        MultipartFile logo,
        MultipartFile[] gallery
) {}
