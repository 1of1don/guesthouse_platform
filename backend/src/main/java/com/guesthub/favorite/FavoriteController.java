package com.guesthub.favorite;

import com.guesthub.guesthouse.Guesthouse;
import com.guesthub.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @GetMapping
    public List<Guesthouse> myFavorites(@AuthenticationPrincipal AuthUser authUser) {
        return favoriteService.favoritesOf(authUser.id());
    }
}
