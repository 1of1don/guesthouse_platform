package com.guesthub.guesthouse;

import com.guesthub.common.ApiException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class GuesthouseRulesTest {

    private GuesthouseForm form(Double price, Double lat, Double lng) {
        return new GuesthouseForm("Riverside", price, "Gaborone", "Botswana", "Nice", "Wifi", "+267 71 234 567",
                lat, lng, null, null);
    }

    @Test
    void priceMustBeAboveZero() {
        assertThrows(ApiException.class, () -> GuesthouseService.validateValues(form(0.0, -24.6, 25.9)));
        assertDoesNotThrow(() -> GuesthouseService.validateValues(form(650.0, -24.6, 25.9)));
    }

    @Test
    void latitudeMustBeOnTheMap() {
        assertThrows(ApiException.class, () -> GuesthouseService.validateValues(form(650.0, 91.0, 25.9)));
    }

    @Test
    void longitudeMustBeOnTheMap() {
        assertThrows(ApiException.class, () -> GuesthouseService.validateValues(form(650.0, -24.6, 181.0)));
    }

    @Test
    void mapPinIsRequiredOnCreate() {
        ApiException ex = assertThrows(ApiException.class,
                () -> GuesthouseService.validateRequired(form(650.0, null, 25.9)));
        assertEquals(400, ex.getStatus());
    }

    @Test
    void amenitiesAcceptCommaListOrJsonArray() {
        assertEquals(List.of("Wifi", "Pool"), GuesthouseService.parseAmenities("Wifi, Pool, Wifi"));
        assertEquals(List.of("Wifi", "Pool"), GuesthouseService.parseAmenities("[\"Wifi\",\"Pool\"]"));
    }
}
