package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.config.DataLoader;
import com.bodhganga.bodhganga.entity.State;
import com.bodhganga.bodhganga.repo.StateRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = com.bodhganga.bodhganga.BodhgangaApplication.class)
@ActiveProfiles("test")
public class DataLoaderStateSyncTests {

    @Autowired
    private DataLoader dataLoader;

    @Autowired
    private StateRepo stateRepo;

    private List<String> get35MaharashtraDistricts() {
        return new ArrayList<>(Arrays.asList(
                "Ahmednagar", "Akola", "Amravati", "Beed", "Bhandara", "Buldhana", "Chandrapur",
                "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur",
                "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik",
                "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara",
                "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"));
    }

    @BeforeEach
    void setUp() {
        stateRepo.deleteAll();
    }

    @Test
    void test1_existingMaharashtraWith35DistrictsGetsChhatrapatiSambhajinagarAdded() {
        State mh = new State();
        mh.setId("maharashtra");
        mh.setCode("MH");
        mh.setName("Maharashtra");
        mh.setCapital("Mumbai");
        mh.setDistricts(get35MaharashtraDistricts());
        stateRepo.save(mh);

        assertEquals(35, stateRepo.findById("maharashtra").get().getDistricts().size());

        dataLoader.seedStates();

        State updatedMh = stateRepo.findById("maharashtra").orElseThrow();
        assertEquals(36, updatedMh.getDistricts().size());
        assertTrue(updatedMh.getDistricts().contains("Chhatrapati Sambhajinagar"));
    }

    @Test
    void test2_existingMaharashtraWith36DistrictsIsUnchanged() {
        List<String> d36 = get35MaharashtraDistricts();
        d36.add("Chhatrapati Sambhajinagar");

        State mh = new State();
        mh.setId("maharashtra");
        mh.setCode("MH");
        mh.setName("Maharashtra");
        mh.setCapital("Mumbai");
        mh.setDistricts(d36);
        stateRepo.save(mh);

        dataLoader.seedStates();

        State afterSync = stateRepo.findById("maharashtra").orElseThrow();
        assertEquals(36, afterSync.getDistricts().size());
    }

    @Test
    void test3_runningSynchronizationTwiceIsIdempotent() {
        State mh = new State();
        mh.setId("maharashtra");
        mh.setCode("MH");
        mh.setName("Maharashtra");
        mh.setDistricts(get35MaharashtraDistricts());
        stateRepo.save(mh);

        dataLoader.seedStates();
        State firstSync = stateRepo.findById("maharashtra").orElseThrow();
        assertEquals(36, firstSync.getDistricts().size());

        dataLoader.seedStates();
        State secondSync = stateRepo.findById("maharashtra").orElseThrow();
        assertEquals(36, secondSync.getDistricts().size());
    }

    @Test
    void test4_existingUnrelatedStateFieldsArePreserved() {
        State mh = new State();
        mh.setId("maharashtra");
        mh.setCode("MH");
        mh.setName("Custom Maharashtra Name");
        mh.setCulture("Unique Culture Metadata");
        mh.setHistory("Custom History Notes");
        mh.setImages(Arrays.asList("custom1.png", "custom2.jpg"));
        mh.setNotesCount(99);
        mh.setDistricts(get35MaharashtraDistricts());
        stateRepo.save(mh);

        dataLoader.seedStates();

        State synced = stateRepo.findById("maharashtra").orElseThrow();
        assertEquals("Custom Maharashtra Name", synced.getName());
        assertEquals("Unique Culture Metadata", synced.getCulture());
        assertEquals("Custom History Notes", synced.getHistory());
        assertEquals(Arrays.asList("custom1.png", "custom2.jpg"), synced.getImages());
        assertEquals(99, synced.getNotesCount());
        assertEquals(36, synced.getDistricts().size());
    }

    @Test
    void test5_existingLegacyStateContentFieldsArePreserved() {
        State mh = new State();
        mh.setId("maharashtra");
        mh.setCode("MH");
        mh.setGeography("Deccan Plateau & Western Ghats");
        mh.setPopulation("112 Million");
        mh.setLanguage("Marathi");
        mh.setDistricts(get35MaharashtraDistricts());
        stateRepo.save(mh);

        dataLoader.seedStates();

        State synced = stateRepo.findById("maharashtra").orElseThrow();
        assertEquals("Deccan Plateau & Western Ghats", synced.getGeography());
        assertEquals("112 Million", synced.getPopulation());
        assertEquals("Marathi", synced.getLanguage());
    }

    @Test
    void test6_existingCustomDistrictsAreNotAccidentallyDeleted() {
        List<String> dWithCustom = get35MaharashtraDistricts();
        dWithCustom.add("Custom Extra District");

        State mh = new State();
        mh.setId("maharashtra");
        mh.setCode("MH");
        mh.setDistricts(dWithCustom);
        stateRepo.save(mh);

        dataLoader.seedStates();

        State synced = stateRepo.findById("maharashtra").orElseThrow();
        assertTrue(synced.getDistricts().contains("Custom Extra District"));
        assertTrue(synced.getDistricts().contains("Chhatrapati Sambhajinagar"));
        assertEquals(37, synced.getDistricts().size());
    }

    @Test
    void test7_missingStateIsCreatedCorrectly() {
        dataLoader.seedStates();

        assertTrue(stateRepo.findById("goa").isPresent());
        State goa = stateRepo.findById("goa").orElseThrow();
        assertEquals("Goa", goa.getName());
        assertEquals(2, goa.getDistricts().size());
    }
}
