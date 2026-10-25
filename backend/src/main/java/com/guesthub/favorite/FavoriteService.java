package com.guesthub.favorite;

import com.guesthub.common.ApiException;
import com.guesthub.guesthouse.Guesthouse;
import com.guesthub.guesthouse.GuesthouseRepository;
import com.guesthub.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favorites;
    private final UserRepository users;
    private final GuesthouseRepository guesthouses;

    @Transactional
    public void add(Long userId, Long guesthouseId) {
        if (!guesthouses.existsById(guesthouseId)) {
            throw ApiException.notFound("Guesthouse not found");
        }
        FavoriteId id = new FavoriteId(userId, guesthouseId);
        if (favorites.existsById(id)) {
            throw ApiException.conflict("Already in favourites");
        }
        Favorite favorite = new Favorite();
        favorite.setId(id);
        favorite.setUser(users.getReferenceById(userId));
        favorite.setGuesthouse(guesthouses.getReferenceById(guesthouseId));
        favorites.save(favorite);
    }

    @Transactional
    public void remove(Long userId, Long guesthouseId) {
        FavoriteId id = new FavoriteId(userId, guesthouseId);
        if (!favorites.existsById(id)) {
            throw ApiException.notFound("Favourite not found");
        }
        favorites.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Guesthouse> favoritesOf(Long userId) {
        return favorites.findById_UserIdOrderByCreatedAtDesc(userId).stream()
                .map(Favorite::getGuesthouse)
                .toList();
    }
}
