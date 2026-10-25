package com.guesthub.favorite;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FavoriteRepository extends JpaRepository<Favorite, FavoriteId> {

    List<Favorite> findById_UserIdOrderByCreatedAtDesc(Long userId);

    @Modifying
    @Query("DELETE FROM Favorite f WHERE f.guesthouse.id = :id")
    void deleteByGuesthouse_Id(@Param("id") Long guesthouseId);

    @Modifying
    @Query("DELETE FROM Favorite f WHERE f.user.id = :id")
    void deleteByUser_Id(@Param("id") Long userId);
}
