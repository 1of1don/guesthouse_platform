package com.guesthub.admin;

import com.guesthub.auth.PasswordResetTokenRepository;
import com.guesthub.common.ApiException;
import com.guesthub.favorite.FavoriteRepository;
import com.guesthub.guesthouse.GuesthouseRepository;
import com.guesthub.rating.RatingRepository;
import com.guesthub.rating.RatingService;
import com.guesthub.security.AuthUser;
import com.guesthub.user.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// Admin Users screen. Creating admins happens HERE on the server, so the
// person creating the account is never logged out (unlike a client-side signup).
@RestController
@RequestMapping("/api/admins")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
public class AdminController {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final RatingRepository ratings;
    private final RatingService ratingService;
    private final FavoriteRepository favorites;
    private final PasswordResetTokenRepository resetTokens;
    private final GuesthouseRepository guesthouses;

    @GetMapping
    public List<UserResponse> list() {
        return users.findByRoleInOrderByCreatedAtAsc(List.of(Role.OWNER, Role.ADMIN)).stream()
                .map(UserResponse::from)
                .toList();
    }

    @PostMapping
    @Transactional
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateAdminRequest request) {
        String email = request.email().toLowerCase().trim();
        if (users.existsByEmail(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        User admin = users.save(User.builder()
                .name(request.name().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(Role.ADMIN)
                .build());
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(admin));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public Map<String, String> remove(@PathVariable Long id, @AuthenticationPrincipal AuthUser me) {
        User target = users.findById(id)
                .orElseThrow(() -> ApiException.notFound("Admin not found"));
        if (target.getRole() == Role.OWNER) {
            throw ApiException.badRequest("Owners cannot be removed");
        }
        if (target.getRole() != Role.ADMIN) {
            throw ApiException.badRequest("This account is not an admin");
        }
        if (target.getId().equals(me.id())) {
            throw ApiException.badRequest("You cannot remove your own account");
        }

        // Clean up rows that point at this user, then fix any averages they affected
        List<Long> ratedGuesthouses = ratings.guesthouseIdsRatedBy(id);
        ratings.deleteByUser_Id(id);
        favorites.deleteByUser_Id(id);
        resetTokens.deleteByUser_Id(id);
        users.delete(target);
        guesthouses.findAllById(ratedGuesthouses).forEach(ratingService::refreshAverage);

        return Map.of("message", "Admin removed");
    }
}
