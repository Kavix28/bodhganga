package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.config.DataLoader;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.State;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.repo.StateRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = com.bodhganga.bodhganga.BodhgangaApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class StateAvailabilityTests {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private StateRepo stateRepo;

    @Autowired
    private ProductRepo productRepo;

    @Autowired
    private DataLoader dataLoader;

    @BeforeEach
    void setUp() {
        productRepo.deleteAll();
        stateRepo.deleteAll();
        dataLoader.seedStates();
    }

    @Test
    void test1_stateWith0PublishedResourcesIsUnavailable() {
        ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                "/api/states/available",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {
                });

        assertEquals(200, response.getStatusCode().value());
        List<Map<String, Object>> states = response.getBody();
        assertNotNull(states);
        assertFalse(states.isEmpty());

        Optional<Map<String, Object>> goaOpt = states.stream()
                .filter(s -> "goa".equals(s.get("stateSlug")) || "goa".equals(s.get("id")))
                .findFirst();

        assertTrue(goaOpt.isPresent());
        Map<String, Object> goa = goaOpt.get();
        assertEquals(0, ((Number) goa.get("notesCount")).longValue());
        assertEquals(Boolean.FALSE, goa.get("isAvailable"));
    }

    @Test
    void test2_stateWith1PublishedResourceIsAvailable() {
        Product p = new Product();
        p.setTitle("Maharashtra History Notes");
        p.setState("Maharashtra");
        p.setStateSlug("maharashtra");
        p.setDistrict("Pune");
        p.setDistrictSlug("pune");
        p.setPublished(true);
        p.setArchived(false);
        p.setCreatedAt(new Date());
        productRepo.save(p);

        ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                "/api/states/available",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {
                });

        List<Map<String, Object>> states = response.getBody();
        assertNotNull(states);

        Optional<Map<String, Object>> mhOpt = states.stream()
                .filter(s -> "maharashtra".equals(s.get("stateSlug")) || "maharashtra".equals(s.get("id")))
                .findFirst();

        assertTrue(mhOpt.isPresent());
        Map<String, Object> mh = mhOpt.get();
        assertEquals(1, ((Number) mh.get("notesCount")).longValue());
        assertEquals(Boolean.TRUE, mh.get("isAvailable"));
    }

    @Test
    void test3_archivedResourceDoesNotMakeStateAvailable() {
        Product p = new Product();
        p.setTitle("Archived Bihar Notes");
        p.setState("Bihar");
        p.setStateSlug("bihar");
        p.setDistrict("Patna");
        p.setDistrictSlug("patna");
        p.setPublished(true);
        p.setArchived(true);
        productRepo.save(p);

        ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                "/api/states/available",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {
                });

        List<Map<String, Object>> states = response.getBody();
        assertNotNull(states);

        Optional<Map<String, Object>> biharOpt = states.stream()
                .filter(s -> "bihar".equals(s.get("stateSlug")) || "bihar".equals(s.get("id")))
                .findFirst();

        assertTrue(biharOpt.isPresent());
        Map<String, Object> bihar = biharOpt.get();
        assertEquals(0, ((Number) bihar.get("notesCount")).longValue());
        assertEquals(Boolean.FALSE, bihar.get("isAvailable"));
    }

    @Test
    void test4_unpublishedResourceDoesNotMakeStateAvailable() {
        Product p = new Product();
        p.setTitle("Draft Gujarat Notes");
        p.setState("Gujarat");
        p.setStateSlug("gujarat");
        p.setDistrict("Surat");
        p.setDistrictSlug("surat");
        p.setPublished(false);
        p.setArchived(false);
        productRepo.save(p);

        ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                "/api/states/available",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {
                });

        List<Map<String, Object>> states = response.getBody();
        assertNotNull(states);

        Optional<Map<String, Object>> gujOpt = states.stream()
                .filter(s -> "gujarat".equals(s.get("stateSlug")) || "gujarat".equals(s.get("id")))
                .findFirst();

        assertTrue(gujOpt.isPresent());
        Map<String, Object> guj = gujOpt.get();
        assertEquals(0, ((Number) guj.get("notesCount")).longValue());
        assertEquals(Boolean.FALSE, guj.get("isAvailable"));
    }

    @Test
    void test5_allCanonicalStatesRemainReturnedEvenWhenCountIs0() {
        ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                "/api/states/available",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {
                });

        List<Map<String, Object>> states = response.getBody();
        assertNotNull(states);
        assertTrue(states.size() >= 36);
    }

    @Test
    void test6_existingStateMetadataIsUnchanged() {
        State originalMh = stateRepo.findById("maharashtra").orElseThrow();
        String origCapital = originalMh.getCapital();
        int origDistrictsCount = originalMh.getDistricts().size();

        restTemplate.exchange(
                "/api/states/available",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {
                });

        State afterMh = stateRepo.findById("maharashtra").orElseThrow();
        assertEquals(origCapital, afterMh.getCapital());
        assertEquals(origDistrictsCount, afterMh.getDistricts().size());
    }
}
