package com.guesthub.stats;

import com.guesthub.guesthouse.Guesthouse;
import com.guesthub.guesthouse.GuesthouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
public class StatsController {

    private final GuesthouseRepository guesthouses;

    @GetMapping("/dashboard")
    @Transactional(readOnly = true)
    public DashboardResponse dashboard() {
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        List<Object[]> cityRows = guesthouses.countByCity();
        DashboardResponse.CityCount topCity = cityRows.isEmpty() ? null
                : new DashboardResponse.CityCount(
                        (String) cityRows.get(0)[0],
                        ((Number) cityRows.get(0)[1]).longValue());

        Guesthouse highest = guesthouses
                .findFirstByRatingCountGreaterThanOrderByAverageRatingDescRatingCountDesc(0)
                .orElse(null);
        DashboardResponse.HighestRated highestRated = highest == null ? null
                : new DashboardResponse.HighestRated(highest.getId(), highest.getName(), highest.getCity(),
                        highest.getAverageRating(), highest.getRatingCount());

        return new DashboardResponse(
                guesthouses.count(),
                topCity,
                highestRated,
                guesthouses.countByCreatedAtGreaterThanEqual(startOfMonth),
                guesthouses.findTop5ByOrderByCreatedAtDesc());
    }
}
