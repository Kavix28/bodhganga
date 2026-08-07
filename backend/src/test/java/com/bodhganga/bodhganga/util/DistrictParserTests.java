package com.bodhganga.bodhganga.util;

import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class DistrictParserTests {

    @Test
    public void testDistrictParsingFormats() {
        // district-44-kurukshetra -> Kurukshetra / kurukshetra
        Map.Entry<String, String> d1 = DistrictParser.parseDistrict("district-44-kurukshetra");
        assertEquals("Kurukshetra", d1.getKey());
        assertEquals("kurukshetra", d1.getValue());

        // district-1-ambala -> Ambala / ambala
        Map.Entry<String, String> d2 = DistrictParser.parseDistrict("district-1-ambala");
        assertEquals("Ambala", d2.getKey());
        assertEquals("ambala", d2.getValue());

        // district_44_kurukshetra -> Kurukshetra / kurukshetra
        Map.Entry<String, String> d3 = DistrictParser.parseDistrict("district_44_kurukshetra");
        assertEquals("Kurukshetra", d3.getKey());
        assertEquals("kurukshetra", d3.getValue());

        // District 44 Kurukshetra -> Kurukshetra / kurukshetra
        Map.Entry<String, String> d4 = DistrictParser.parseDistrict("District 44 Kurukshetra");
        assertEquals("Kurukshetra", d4.getKey());
        assertEquals("kurukshetra", d4.getValue());

        // District-44 Kurukshetra -> Kurukshetra / kurukshetra
        Map.Entry<String, String> d5 = DistrictParser.parseDistrict("District-44 Kurukshetra");
        assertEquals("Kurukshetra", d5.getKey());
        assertEquals("kurukshetra", d5.getValue());

        // 01 - Ambala District -> Ambala / ambala
        Map.Entry<String, String> d6 = DistrictParser.parseDistrict("01 - Ambala District");
        assertEquals("Ambala", d6.getKey());
        assertEquals("ambala", d6.getValue());
    }

    @Test
    public void testGenericAndExcludedDistricts() {
        Map.Entry<String, String> d1 = DistrictParser.parseDistrict("general");
        assertEquals("general", d1.getKey());
        assertEquals("general", d1.getValue());

        Map.Entry<String, String> d2 = DistrictParser.parseDistrict("state-images");
        assertEquals("general", d2.getKey());
        assertEquals("general", d2.getValue());
    }

    @Test
    public void testExtractLocationFromFolderPath() {
        List<String> path = List.of("State 1- Haryana", "district-44-kurukshetra", "Free Resources");
        DistrictParser.ParsedLocation loc = DistrictParser.extractLocation(path, null);

        assertEquals("Haryana", loc.getState());
        assertEquals("haryana", loc.getStateSlug());
        assertEquals("Kurukshetra", loc.getDistrict());
        assertEquals("kurukshetra", loc.getDistrictSlug());
    }

    @Test
    public void testExtractLocationFromStorageKeyFallback() {
        String key = "haryana/district-44-kurukshetra/free/notes.pdf";
        DistrictParser.ParsedLocation loc = DistrictParser.extractLocation(null, key);

        assertEquals("Haryana", loc.getState());
        assertEquals("haryana", loc.getStateSlug());
        assertEquals("Kurukshetra", loc.getDistrict());
        assertEquals("kurukshetra", loc.getDistrictSlug());
    }
}
