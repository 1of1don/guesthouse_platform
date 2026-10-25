package com.guesthub.rating;

import java.time.LocalDateTime;

// Public view of a rating (no user email/id leak)
public record RatingResponse(Long id, int stars, LocalDateTime createdAt, String userName) {

    public static RatingResponse from(Rating rating) {
        return new RatingResponse(
                rating.getId(),
                rating.getStars(),
                rating.getCreatedAt(),
                rating.getUser().getName());
    }
}
