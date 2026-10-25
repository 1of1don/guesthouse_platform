package com.guesthub.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.guesthub.user.Role;
import com.guesthub.user.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class JwtService {

    private final Algorithm algorithm;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.algorithm = Algorithm.HMAC256(secret.getBytes());
        this.expirationMs = expirationMs;
    }

    public String generateToken(User user) {
        Instant now = Instant.now();
        return JWT.create()
                .withSubject(String.valueOf(user.getId()))
                .withClaim("role", user.getRole().name())
                .withIssuedAt(now)
                .withExpiresAt(now.plusMillis(expirationMs))
                .sign(algorithm);
    }

    public AuthUser verify(String token) {
        var jwt = JWT.require(algorithm).build().verify(token);
        return new AuthUser(
                Long.parseLong(jwt.getSubject()),
                Role.valueOf(jwt.getClaim("role").asString()));
    }
}
