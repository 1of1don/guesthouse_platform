package com.guesthub.auth;

import com.guesthub.auth.dto.*;
import com.guesthub.common.ApiException;
import com.guesthub.mail.EmailService;
import com.guesthub.security.AuthUser;
import com.guesthub.security.JwtService;
import com.guesthub.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository users;
    private final PasswordResetTokenRepository resetTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Value("${app.reset-url-base}")
    private String resetUrlBase;

    private static final SecureRandom RANDOM = new SecureRandom();

    // POST /api/auth/signup - consumer account (the "Create an account" screen)
    public AuthResponse signup(SignupRequest request) {
        String email = request.email().toLowerCase().trim();
        if (users.existsByEmail(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        User user = users.save(User.builder()
                .name(request.name().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(Role.CONSUMER)
                .build());
        return buildResponse(user);
    }

    public AuthResponse login(LoginRequest request, boolean adminOnly) {
        User user = users.findByEmail(request.email().toLowerCase().trim())
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid email or password");
        }
        // The admin portal login (Figma page 3) must reject consumer accounts
        if (adminOnly && user.getRole() == Role.CONSUMER) {
            throw ApiException.forbidden("This account does not have admin access");
        }
        return buildResponse(user);
    }

    public UserResponse me(AuthUser authUser) {
        return users.findById(authUser.id())
                .map(UserResponse::from)
                .orElseThrow(() -> ApiException.notFound("User not found"));
    }

    // Always returns the same message, so attackers cannot probe which emails exist
    public void forgotPassword(ForgotPasswordRequest request) {
        users.findByEmail(request.email().toLowerCase().trim()).ifPresent(user -> {
            String token = randomToken();
            PasswordResetToken record = new PasswordResetToken();
            record.setToken(token);
            record.setUser(user);
            record.setExpiresAt(LocalDateTime.now().plusHours(1));
            resetTokens.save(record);

            emailService.sendReset(user.getEmail(), resetUrlBase + "?token=" + token);
        });
    }

    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken record = resetTokens.findByToken(request.token())
                .orElseThrow(() -> ApiException.badRequest("Reset link is invalid or has expired"));
        if (record.getUsedAt() != null || record.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw ApiException.badRequest("Reset link is invalid or has expired");
        }
        User user = record.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        users.save(user);

        record.setUsedAt(LocalDateTime.now());
        resetTokens.save(record);
    }

    private String randomToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes); // 64 random hex characters
    }

    private AuthResponse buildResponse(User user) {
        return new AuthResponse(jwtService.generateToken(user), UserResponse.from(user));
    }
}
