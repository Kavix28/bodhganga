package com.bodhganga.bodhganga.services;

import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.repo.ProductRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SelfHealingServiceTest {

    private ProductRepo productRepo;
    private S3Service s3Service;
    private SelfHealingService selfHealingService;

    @BeforeEach
    void setUp() {
        productRepo = mock(ProductRepo.class);
        s3Service = mock(S3Service.class);
        selfHealingService = new SelfHealingService(productRepo, s3Service);
    }

    @Test
    void testSelfHealingDeactivatesDuplicateOlderVersions() {
        Product v1 = new Product();
        v1.setId("p1");
        v1.setGoogleDriveFileId("drive-123");
        v1.setVersion(1);
        v1.setIsLatestVersion(true);
        v1.setPublished(true);
        v1.setUpdatedAt(new Date(100000L));

        Product v2 = new Product();
        v2.setId("p2");
        v2.setGoogleDriveFileId("drive-123");
        v2.setVersion(2);
        v2.setIsLatestVersion(true);
        v2.setPublished(true);
        v2.setUpdatedAt(new Date(200000L));

        when(productRepo.findAll()).thenReturn(List.of(v1, v2));

        Map<String, Object> auditResult = selfHealingService.runSelfHealingAudit();

        assertTrue((Boolean) auditResult.get("success"));
        assertEquals(1, auditResult.get("duplicatesDisabled"));
        assertFalse(v1.getIsLatestVersion());
        assertFalse(v1.isPublished());
        assertTrue(v2.getIsLatestVersion());
    }

    @Test
    void testSelfHealingRepairsMissingSlugsAndBreadcrumbs() {
        Product p = new Product();
        p.setId("p1");
        p.setState("Madhya Pradesh");
        p.setCategory("Current Affairs");

        when(productRepo.findAll()).thenReturn(List.of(p));

        Map<String, Object> auditResult = selfHealingService.runSelfHealingAudit();

        assertEquals(1, auditResult.get("repairedSlugs"));
        assertEquals("madhya-pradesh", p.getStateSlug());
        assertEquals("current-affairs", p.getCategorySlug());
        assertNotNull(p.getBreadcrumbs());
        assertEquals(2, p.getBreadcrumbs().size());
    }
}
