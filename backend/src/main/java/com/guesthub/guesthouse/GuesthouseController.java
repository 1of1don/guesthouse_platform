package com.guesthub.guesthouse;

import com.guesthub.favorite.FavoriteService;
import com.guesthub.rating.RatingRequest;
import com.guesthub.rating.RatingResponse;
import com.guesthub.rating.RatingService;
import com.guesthub.security.AuthUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/guesthouses")
@RequiredArgsConstructor
public class GuesthouseController {

    private final GuesthouseService guesthouseService;
    private final RatingService ratingService;
    private final FavoriteService favoriteService;

    // Public: powers the consumer app's search/browse (city, search, sort, filters, pagination)
    @GetMapping
    public Map<String, Object> list(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "desc") String order,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String amenities,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int size) {
        int safePage = Math.max(1, page);
        int safeSize = Math.min(50, Math.max(1, size));
        Page<Guesthouse> result = guesthouseService.list(city, search, sort, order, minPrice, maxPrice, amenities, safePage, safeSize);
        return Map.of(
                "data", result.getContent(),
                "total", result.getTotalElements(),
                "page", safePage,
                "totalPages", result.getTotalPages());
    }

    @GetMapping("/{id}")
    public Map<String, Object> getOne(@PathVariable Long id) {
        Guesthouse guesthouse = guesthouseService.get(id);
        List<RatingResponse> ratings = ratingService.latestFor(guesthouse.getId());
        return Map.of("guesthouse", guesthouse, "ratings", ratings);
    }

    // Add/Edit Guesthouse form (Figma page 4) - multipart: fields + optional logo + up to 5 gallery images
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public Guesthouse create(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Double pricePerNight,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String amenities,
            @RequestParam(required = false) String contact,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(value = "logo", required = false) MultipartFile logo,
            @RequestParam(value = "gallery", required = false) MultipartFile[] gallery) {
        return guesthouseService.create(
                new GuesthouseForm(name, pricePerNight, city, country, description, amenities, contact, latitude, longitude, logo, gallery));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public Guesthouse update(
            @PathVariable Long id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Double pricePerNight,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String amenities,
            @RequestParam(required = false) String contact,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(value = "logo", required = false) MultipartFile logo,
            @RequestParam(value = "gallery", required = false) MultipartFile[] gallery) {
        return guesthouseService.update(id,
                new GuesthouseForm(name, pricePerNight, city, country, description, amenities, contact, latitude, longitude, logo, gallery));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public Map<String, String> delete(@PathVariable Long id) {
        guesthouseService.delete(id);
        return Map.of("message", "Guesthouse deleted");
    }

    // Consumer features
    @PostMapping("/{id}/ratings")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> rate(@PathVariable Long id,
                                    @Valid @RequestBody RatingRequest request,
                                    @AuthenticationPrincipal AuthUser authUser) {
        return ratingService.rate(authUser.id(), id, request.stars());
    }

    @PostMapping("/{id}/favorite")
    @PreAuthorize("isAuthenticated()")
    public Map<String, String> addFavorite(@PathVariable Long id, @AuthenticationPrincipal AuthUser authUser) {
        favoriteService.add(authUser.id(), id);
        return Map.of("message", "Added to favourites");
    }

    @DeleteMapping("/{id}/favorite")
    @PreAuthorize("isAuthenticated()")
    public Map<String, String> removeFavorite(@PathVariable Long id, @AuthenticationPrincipal AuthUser authUser) {
        favoriteService.remove(authUser.id(), id);
        return Map.of("message", "Removed from favourites");
    }
}
