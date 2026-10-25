package com.guesthub.stats;

import com.guesthub.guesthouse.Guesthouse;

import java.util.List;

// Dashboard cards: total guesthouses, top city, highest rated, added this month + recent table
public record DashboardResponse(
        long totalGuesthouses,
        CityCount topCity,
        HighestRated highestRated,
        long addedThisMonth,
        List<Guesthouse> recent
) {
    public record CityCount(String city, long count) {}
    public record HighestRated(Long id, String name, String city, double averageRating, int ratingCount) {}
}
