package com.guesthub.auth.dto;

import com.guesthub.user.UserResponse;

public record AuthResponse(String token, UserResponse user) {}
