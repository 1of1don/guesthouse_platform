package com.guesthub.rating;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {

    Optional<Rating> findByUser_IdAndGuesthouse_Id(Long userId, Long guesthouseId);

    List<Rating> findTop10ByGuesthouse_IdOrderByCreatedAtDesc(Long guesthouseId);

    // Two simple queries instead of one Object[] (a multi-column single-row
    // result comes back nested and caused a ClassCastException).
    @Query("SELECT COALESCE(AVG(r.stars), 0) FROM Rating r WHERE r.guesthouse.id = :id")
    Double averageFor(@Param("id") Long guesthouseId);

    long countByGuesthouse_Id(Long guesthouseId);

    @Query("SELECT DISTINCT r.guesthouse.id FROM Rating r WHERE r.user.id = :id")
    List<Long> guesthouseIdsRatedBy(@Param("id") Long userId);

    @Modifying
    @Query("DELETE FROM Rating r WHERE r.guesthouse.id = :id")
    void deleteByGuesthouse_Id(@Param("id") Long guesthouseId);

    @Modifying
    @Query("DELETE FROM Rating r WHERE r.user.id = :id")
    void deleteByUser_Id(@Param("id") Long userId);
}
