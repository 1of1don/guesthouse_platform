package com.guesthub.guesthouse;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface GuesthouseRepository extends JpaRepository<Guesthouse, Long>, JpaSpecificationExecutor<Guesthouse> {

    Optional<Guesthouse> findByNameIgnoreCase(String name);

    // Only guesthouses that actually have ratings can be "highest rated"
    Optional<Guesthouse> findFirstByRatingCountGreaterThanOrderByAverageRatingDescRatingCountDesc(int minCount);

    List<Guesthouse> findTop5ByOrderByCreatedAtDesc();

    long countByCreatedAtGreaterThanEqual(LocalDateTime date);

    // "Gaborone (34)" - one GROUP BY query
    @Query("SELECT g.city, COUNT(g) FROM Guesthouse g GROUP BY g.city ORDER BY COUNT(g) DESC")
    List<Object[]> countByCity();
}
