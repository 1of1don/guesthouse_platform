package com.guesthub.rating;

import com.guesthub.common.ApiException;
import com.guesthub.guesthouse.Guesthouse;
import com.guesthub.guesthouse.GuesthouseRepository;
import com.guesthub.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratings;
    private final GuesthouseRepository guesthouses;
    private final UserRepository users;

    // One rating per user per guesthouse (upsert); the cached average on the
    // guesthouse is refreshed in the same transaction.
    @Transactional
    public Map<String, Object> rate(Long userId, Long guesthouseId, int stars) {
        Guesthouse guesthouse = guesthouses.findById(guesthouseId)
                .orElseThrow(() -> ApiException.notFound("Guesthouse not found"));

        Rating rating = ratings.findByUser_IdAndGuesthouse_Id(userId, guesthouseId)
                .orElseGet(() -> {
                    Rating r = new Rating();
                    r.setUser(users.getReferenceById(userId));
                    r.setGuesthouse(guesthouse);
                    return r;
                });
        rating.setStars(stars);
        ratings.saveAndFlush(rating);

        refreshAverage(guesthouse);

        return Map.of(
                "rating", Map.of("guesthouseId", guesthouseId, "stars", stars),
                "guesthouse", Map.of(
                        "id", guesthouse.getId(),
                        "averageRating", guesthouse.getAverageRating(),
                        "ratingCount", guesthouse.getRatingCount()));
    }

    @Transactional
    public void refreshAverage(Guesthouse guesthouse) {
        Double avg = ratings.averageFor(guesthouse.getId());
        long count = ratings.countByGuesthouse_Id(guesthouse.getId());
        guesthouse.setAverageRating(roundOneDecimal(avg == null ? 0 : avg));
        guesthouse.setRatingCount((int) count);
        guesthouses.save(guesthouse);
    }

    public static double roundOneDecimal(double value) {
        return Math.round(value * 10) / 10.0;
    }

    @Transactional(readOnly = true)
    public List<RatingResponse> latestFor(Long guesthouseId) {
        return ratings.findTop10ByGuesthouse_IdOrderByCreatedAtDesc(guesthouseId).stream()
                .map(RatingResponse::from)
                .toList();
    }
}
