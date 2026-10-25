package com.guesthub.guesthouse;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// Field names are the shared contract with web + mobile:
// name, pricePerNight, city, country, description, amenities, contact,
// latitude, longitude, logoUrl, galleryUrls, averageRating, ratingCount, createdAt
@Entity
@Table(name = "guesthouses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Guesthouse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private double pricePerNight;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String country;

    @Column(length = 2000)
    private String description;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "guesthouse_amenities", joinColumns = @JoinColumn(name = "guesthouse_id"))
    @Column(name = "amenity")
    private List<String> amenities = new ArrayList<>();

    @Column(nullable = false)
    private String contact;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    private String logoUrl;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "guesthouse_gallery", joinColumns = @JoinColumn(name = "guesthouse_id"))
    @Column(name = "url")
    private List<String> galleryUrls = new ArrayList<>();

    // cached rating so the dashboard's "Highest Rated" card is a cheap query
    private double averageRating;
    private int ratingCount;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
