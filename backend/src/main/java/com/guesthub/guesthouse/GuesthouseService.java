package com.guesthub.guesthouse;

import com.guesthub.common.ApiException;
import com.guesthub.favorite.FavoriteRepository;
import com.guesthub.image.CloudinaryService;
import com.guesthub.rating.RatingRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class GuesthouseService {

    public static final int MAX_GALLERY_IMAGES = 5;
    private static final Set<String> IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final GuesthouseRepository guesthouses;
    private final RatingRepository ratings;
    private final FavoriteRepository favorites;
    private final CloudinaryService cloudinary;

    // Accept both short names and the real field names from web/mobile
    private static final Map<String, String> SORT_COLUMNS = Map.of(
            "price", "pricePerNight",
            "pricePerNight", "pricePerNight",
            "rating", "averageRating",
            "averageRating", "averageRating",
            "newest", "createdAt",
            "createdAt", "createdAt",
            "name", "name");

    @Transactional(readOnly = true)
    public Page<Guesthouse> list(String city, String search, String sort, String order,
                                 Double minPrice, Double maxPrice, String amenities,
                                 int page, int size) {
        Specification<Guesthouse> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (city != null && !city.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("city")), "%" + escapeLike(city.toLowerCase().trim()) + "%", '\\'));
            }
            if (search != null && !search.isBlank()) {
                String like = "%" + escapeLike(search.toLowerCase().trim()) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like, '\\'),
                        cb.like(cb.lower(root.get("city")), like, '\\'),
                        cb.like(cb.lower(root.get("country")), like, '\\'),
                        cb.like(cb.lower(root.get("description")), like, '\\')));
            }
            if (minPrice != null) predicates.add(cb.ge(root.get("pricePerNight"), minPrice));
            if (maxPrice != null) predicates.add(cb.le(root.get("pricePerNight"), maxPrice));
            if (amenities != null && !amenities.isBlank()) {
                query.distinct(true);
                predicates.add(root.join("amenities").in(parseAmenities(amenities)));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        String column = SORT_COLUMNS.getOrDefault(sort, "createdAt");
        Sort.Direction direction = "asc".equalsIgnoreCase(order) ? Sort.Direction.ASC : Sort.Direction.DESC;
        // secondary sort on id keeps pages stable when values tie
        Sort sortBy = Sort.by(direction, column).and(Sort.by(Sort.Direction.DESC, "id"));
        return guesthouses.findAll(spec, PageRequest.of(page - 1, size, sortBy));
    }

    @Transactional(readOnly = true)
    public Guesthouse get(Long id) {
        return guesthouses.findById(id)
                .orElseThrow(() -> ApiException.notFound("Guesthouse not found"));
    }

    @Transactional
    public Guesthouse create(GuesthouseForm form) {
        validateRequired(form);
        validateValues(form);
        ensureNameFree(form.name(), null);
        Guesthouse g = Guesthouse.builder()
                .name(form.name().trim())
                .pricePerNight(form.pricePerNight())
                .city(form.city().trim())
                .country(form.country().trim())
                .description(form.description().trim())
                .amenities(new ArrayList<>(parseAmenities(form.amenities())))
                .contact(form.contact().trim())
                .latitude(form.latitude())
                .longitude(form.longitude())
                .build();
        applyImages(g, form.logo(), form.gallery());
        return guesthouses.save(g);
    }

    @Transactional
    public Guesthouse update(Long id, GuesthouseForm form) {
        Guesthouse g = get(id);
        validateValues(form);
        if (form.name() != null) {
            if (form.name().isBlank()) throw ApiException.badRequest("name cannot be empty");
            ensureNameFree(form.name(), id);
            g.setName(form.name().trim());
        }
        if (form.pricePerNight() != null) g.setPricePerNight(form.pricePerNight());
        if (notBlank(form.city())) g.setCity(form.city().trim());
        if (notBlank(form.country())) g.setCountry(form.country().trim());
        if (notBlank(form.description())) g.setDescription(form.description().trim());
        if (form.amenities() != null) g.setAmenities(new ArrayList<>(parseAmenities(form.amenities())));
        if (notBlank(form.contact())) g.setContact(form.contact().trim());
        if (form.latitude() != null) g.setLatitude(form.latitude());
        if (form.longitude() != null) g.setLongitude(form.longitude());
        applyImages(g, form.logo(), form.gallery()); // images only replaced if new ones uploaded
        return guesthouses.save(g);
    }

    // Ratings and favourites point at the guesthouse, so remove them first
    // (otherwise the database rejects the delete with a foreign-key error).
    @Transactional
    public void delete(Long id) {
        Guesthouse g = get(id);
        ratings.deleteByGuesthouse_Id(id);
        favorites.deleteByGuesthouse_Id(id);
        guesthouses.delete(g);
    }

    private void ensureNameFree(String name, Long ownId) {
        guesthouses.findByNameIgnoreCase(name.trim()).ifPresent(existing -> {
            if (!existing.getId().equals(ownId)) {
                throw ApiException.conflict("A guesthouse with this name already exists");
            }
        });
    }

    static void validateRequired(GuesthouseForm form) {
        if (!notBlank(form.name()) || !notBlank(form.city()) || !notBlank(form.country())
                || !notBlank(form.description()) || !notBlank(form.contact())) {
            throw ApiException.badRequest("name, city, country, description and contact are required");
        }
        if (form.pricePerNight() == null) {
            throw ApiException.badRequest("pricePerNight is required and must be a number");
        }
        if (form.latitude() == null || form.longitude() == null) {
            throw ApiException.badRequest("A map pin is required (latitude and longitude)");
        }
    }

    static void validateValues(GuesthouseForm form) {
        if (form.pricePerNight() != null && (form.pricePerNight() <= 0 || form.pricePerNight().isNaN())) {
            throw ApiException.badRequest("pricePerNight must be greater than 0");
        }
        if (form.latitude() != null && (form.latitude() < -90 || form.latitude() > 90)) {
            throw ApiException.badRequest("latitude must be between -90 and 90");
        }
        if (form.longitude() != null && (form.longitude() < -180 || form.longitude() > 180)) {
            throw ApiException.badRequest("longitude must be between -180 and 180");
        }
        if (form.gallery() != null && form.gallery().length > MAX_GALLERY_IMAGES) {
            throw ApiException.badRequest("You can upload at most " + MAX_GALLERY_IMAGES + " gallery images");
        }
    }

    private void applyImages(Guesthouse g, MultipartFile logo, MultipartFile[] gallery) {
        try {
            if (logo != null && !logo.isEmpty()) {
                checkImage(logo);
                String url = cloudinary.upload(logo.getBytes(), "micasa/logos");
                if (url != null) g.setLogoUrl(url);
            }
            if (gallery != null && gallery.length > 0) {
                List<String> urls = new ArrayList<>();
                for (MultipartFile file : gallery) {
                    if (file != null && !file.isEmpty()) {
                        checkImage(file);
                        String url = cloudinary.upload(file.getBytes(), "micasa/gallery");
                        if (url != null) urls.add(url);
                    }
                }
                if (!urls.isEmpty()) g.setGalleryUrls(urls);
            }
        } catch (java.io.IOException e) {
            throw new ApiException(500, "Failed to read uploaded image");
        }
    }

    private static void checkImage(MultipartFile file) {
        String type = file.getContentType();
        if (type == null || !IMAGE_TYPES.contains(type.toLowerCase())) {
            throw ApiException.badRequest("Images must be JPG, PNG or WEBP");
        }
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static String escapeLike(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    static List<String> parseAmenities(String value) {
        if (value == null || value.isBlank()) return new ArrayList<>();
        String cleaned = value.trim();
        if (cleaned.startsWith("[")) { // frontend may send a JSON array instead
            cleaned = cleaned.replaceAll("[\\[\\]\"]", "");
        }
        return Arrays.stream(cleaned.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .toList();
    }
}
