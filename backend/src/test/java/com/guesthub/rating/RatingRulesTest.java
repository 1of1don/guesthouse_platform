package com.guesthub.rating;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RatingRulesTest {

    @Test
    void averageIsRoundedToOneDecimal() {
        assertEquals(4.7, RatingService.roundOneDecimal(4.666));
        assertEquals(4.5, RatingService.roundOneDecimal(4.45));
    }
}
