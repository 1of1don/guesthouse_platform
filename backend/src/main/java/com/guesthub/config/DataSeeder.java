package com.guesthub.config;

import com.guesthub.guesthouse.Guesthouse;
import com.guesthub.guesthouse.GuesthouseRepository;
import com.guesthub.user.Role;
import com.guesthub.user.User;
import com.guesthub.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

// Runs once on startup: creates the Owner account and the demo guesthouses
// from the Figma (Riverside, Acacia Lodge, Kalahari Rest Stop) if missing.
// Ratings start at 0 - averageRating is always computed from real ratings rows.
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository users;
    private final GuesthouseRepository guesthouses;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.owner.name}") private String ownerName;
    @Value("${app.owner.email}") private String ownerEmail;
    @Value("${app.owner.password}") private String ownerPassword;

    @Value("${app.jwt.secret}") private String jwtSecret;

    @Override
    public void run(String... args) {
        if (jwtSecret.startsWith("dev-only") || jwtSecret.length() < 32) {
            System.out.println("WARNING: JWT_SECRET is the dev default or too short - set a long random value in .env");
        }
        if ("OwnerPass123!".equals(ownerPassword)) {
            System.out.println("WARNING: OWNER_PASSWORD is the default from the README - change it in .env");
        }
        String email = ownerEmail.toLowerCase().trim();
        if (!users.existsByEmail(email)) {
            users.save(User.builder()
                    .name(ownerName)
                    .email(email)
                    .passwordHash(passwordEncoder.encode(ownerPassword))
                    .role(Role.OWNER)
                    .build());
            System.out.println("Seeded owner account: " + email);
        }

        seed(Guesthouse.builder()
                .name("Riverside Guesthouse").pricePerNight(650).city("Gaborone").country("Botswana")
                .description("A cozy riverside stay with garden views, walking distance to the CBD.")
                .amenities(List.of("Wifi", "Parking", "Pool", "Breakfast"))
                .contact("+267 71 234 567").latitude(-24.6282).longitude(25.9231).build());

        seed(Guesthouse.builder()
                .name("Acacia Lodge").pricePerNight(480).city("Francistown").country("Botswana")
                .description("Warm hospitality a short drive from the city centre.")
                .amenities(List.of("Wifi", "Parking", "Breakfast"))
                .contact("+267 74 000 111").latitude(-21.1661).longitude(27.5079).build());

        seed(Guesthouse.builder()
                .name("Kalahari Rest Stop").pricePerNight(720).city("Maun").country("Botswana")
                .description("Gateway to the Okavango Delta, perfect before a safari.")
                .amenities(List.of("Wifi", "Pool", "Restaurant"))
                .contact("+267 75 222 333").latitude(-19.9996).longitude(23.4181).build());
    }

    private void seed(Guesthouse g) {
        if (guesthouses.findByNameIgnoreCase(g.getName()).isEmpty()) {
            guesthouses.save(g);
            System.out.println("Seeded guesthouse: " + g.getName());
        }
    }
}
