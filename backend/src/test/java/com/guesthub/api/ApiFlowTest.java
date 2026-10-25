package com.guesthub.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// Boots the whole API against an in-memory database and walks the main flows.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiFlowTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private String login(String path, String email, String password) throws Exception {
        String body = mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return "Bearer " + json.readTree(body).get("token").asText();
    }

    @Test
    void fullFlow() throws Exception {
        String owner = login("/api/auth/admin/login", "owner@test.bw", "OwnerTest123!");

        // public list uses the shared field names
        mvc.perform(get("/api/guesthouses?sort=pricePerNight&order=asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].latitude").exists())
                .andExpect(jsonPath("$.data[0].averageRating").exists())
                .andExpect(jsonPath("$.data[0].createdAt").exists());

        // /me without a token is a 401 (was a 500 before)
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());

        // owner creates an admin on the server
        String adminJson = mvc.perform(post("/api/admins").header("Authorization", owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Ada\",\"email\":\"ada@test.bw\",\"password\":\"secret12\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long adminId = json.readTree(adminJson).get("id").asLong();
        String admin = login("/api/auth/admin/login", "ada@test.bw", "secret12");

        // admin cannot manage admins
        mvc.perform(get("/api/admins").header("Authorization", admin)).andExpect(status().isForbidden());

        // admin creates a guesthouse
        String gh = mvc.perform(multipart("/api/guesthouses").header("Authorization", admin)
                        .param("name", "Test Lodge").param("pricePerNight", "500").param("city", "Gaborone")
                        .param("country", "Botswana").param("description", "d").param("contact", "123")
                        .param("amenities", "Wifi,Pool").param("latitude", "-24.6").param("longitude", "25.9"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        long ghId = json.readTree(gh).get("id").asLong();

        // duplicate name -> 409
        mvc.perform(multipart("/api/guesthouses").header("Authorization", admin)
                        .param("name", "test lodge").param("pricePerNight", "500").param("city", "Gaborone")
                        .param("country", "Botswana").param("description", "d").param("contact", "123")
                        .param("latitude", "-24.6").param("longitude", "25.9"))
                .andExpect(status().isConflict());

        // consumer signs up, rates and favourites
        String signup = mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Kim\",\"email\":\"kim@test.bw\",\"password\":\"secret12\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String consumer = "Bearer " + json.readTree(signup).get("token").asText();

        mvc.perform(post("/api/guesthouses/" + ghId + "/ratings").header("Authorization", consumer)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"stars\":4}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.guesthouse.averageRating").value(4.0));
        mvc.perform(post("/api/guesthouses/" + ghId + "/favorite").header("Authorization", consumer))
                .andExpect(status().isOk());
        mvc.perform(get("/api/favorites").header("Authorization", consumer))
                .andExpect(jsonPath("$[0].id").value(ghId));

        // consumers cannot see the dashboard; admins can
        mvc.perform(get("/api/stats/dashboard").header("Authorization", consumer)).andExpect(status().isForbidden());
        mvc.perform(get("/api/stats/dashboard").header("Authorization", admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalGuesthouses").value(4))
                .andExpect(jsonPath("$.topCity.city").value("Gaborone"))
                .andExpect(jsonPath("$.highestRated.name").value("Test Lodge"));

        // deleting a guesthouse that has ratings + favourites works (was a foreign-key error)
        mvc.perform(delete("/api/guesthouses/" + ghId).header("Authorization", admin)).andExpect(status().isOk());

        // removed admin loses access straight away
        mvc.perform(delete("/api/admins/" + adminId).header("Authorization", owner)).andExpect(status().isOk());
        mvc.perform(get("/api/stats/dashboard").header("Authorization", admin)).andExpect(status().isUnauthorized());

        // the owner can never be removed
        JsonNode me = json.readTree(mvc.perform(get("/api/auth/me").header("Authorization", owner))
                .andReturn().getResponse().getContentAsString());
        mvc.perform(delete("/api/admins/" + me.get("id").asLong()).header("Authorization", owner))
                .andExpect(status().isBadRequest());
    }
}
