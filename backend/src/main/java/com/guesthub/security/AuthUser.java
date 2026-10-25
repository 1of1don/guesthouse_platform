package com.guesthub.security;

import com.guesthub.user.Role;

import java.io.Serializable;

// What we store in the SecurityContext after a JWT is verified
public record AuthUser(Long id, Role role) implements Serializable {
}
