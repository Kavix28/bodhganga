package com.bodhganga.bodhganga.service;

import com.google.api.services.drive.model.File;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.services.DriveToS3PipelineTask;
import com.bodhganga.bodhganga.services.GoogleDriveSyncService;
import com.bodhganga.bodhganga.services.S3Service;
import com.bodhganga.bodhganga.util.ProductMetadataUtil;
import com.bodhganga.bodhganga.util.ProductMetadataUtil.AccessType;
import com.bodhganga.bodhganga.util.ProductMetadataUtil.HierarchicalMetadata;
import com.bodhganga.bodhganga.util.ProductMetadataUtil.ItemType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.ByteArrayInputStream;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest(classes = com.bodhganga.bodhganga.BodhgangaApplication.class, webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
public class ReconciliationPipelineTests {

    @Autowired
    private DriveToS3PipelineTask pipelineTask;

    @Autowired
    private ProductRepo productRepo;

    @MockBean
    private GoogleDriveSyncService googleDriveSyncService;

    @MockBean
    private S3Service s3Service;

    @BeforeEach
    void setUp() {
        productRepo.deleteAll();

        ReflectionTestUtils.setField(pipelineTask, "sourceFolderId", "source-folder-id");
        ReflectionTestUtils.setField(pipelineTask, "archiveFolderId", "archive-folder-id");
        ReflectionTestUtils.setField(pipelineTask, "pipelineEnabled", true);

        when(googleDriveSyncService.isConfigured()).thenReturn(true);
        when(s3Service.getBucketName()).thenReturn("test-bucket-name");
    }

    private File mkFolder(String id, String name) {
        File f = new File();
        f.setId(id);
        f.setName(name);
        f.setMimeType("application/vnd.google-apps.folder");
        return f;
    }

    private File mkFile(String id, String name, String mimeType, Long size) {
        File f = new File();
        f.setId(id);
        f.setName(name);
        f.setMimeType(mimeType);
        f.setSize(size);
        return f;
    }

    // ── 1. ALL FOUR TIER STATES VERIFICATION ─────────────────────────────────
    @Test
    void testAllFourTierStatesInMetadataUtil() {
        // FREE
        HierarchicalMetadata freeMeta = ProductMetadataUtil.extractMetadata(
                List.of("State 1- Maharashtra", "District 51- Akola", "Free Resources"), "guide.pdf");
        assertEquals(AccessType.FREE, freeMeta.accessType);
        assertTrue(freeMeta.hasTierFolder);
        assertTrue(freeMeta.isFree);

        // PAID
        HierarchicalMetadata paidMeta = ProductMetadataUtil.extractMetadata(
                List.of("State 1- Maharashtra", "District 51- Akola", "Paid  Resources"), "guide.pdf");
        assertEquals(AccessType.PAID, paidMeta.accessType);
        assertTrue(paidMeta.hasTierFolder);
        assertFalse(paidMeta.isFree);

        // UNKNOWN
        HierarchicalMetadata unknownMeta = ProductMetadataUtil.extractMetadata(
                List.of("State 1- Maharashtra", "District 51- Akola"), "guide.pdf");
        assertEquals(AccessType.UNKNOWN, unknownMeta.accessType);
        assertFalse(unknownMeta.hasTierFolder);
        assertFalse(unknownMeta.isFree);

        // CONFLICT
        HierarchicalMetadata conflictMeta = ProductMetadataUtil.extractMetadata(
                List.of("State 1- Maharashtra", "Free Resources", "Paid Resources"), "guide.pdf");
        assertEquals(AccessType.CONFLICT, conflictMeta.accessType);
        assertFalse(conflictMeta.hasTierFolder);
        assertFalse(conflictMeta.isFree);
    }

    // ── 2. DRIVE PARENT CHANGE (FREE -> PAID WITH SAME CHECKSUM) ──────────────
    @Test
    void testDriveParentChangeFreeToPaidSameChecksum() throws Exception {
        File stateFolder = mkFolder("st-1", "Maharashtra");
        File distFolder = mkFolder("dist-1", "Akola District");
        File freeFolder = mkFolder("free-1", "Free Resources");
        File pdfFile = mkFile("pdf-file-1", "AkolaNotes.pdf", "application/pdf", 1024L);

        when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));
        when(googleDriveSyncService.listFilesInFolder("st-1")).thenReturn(List.of(distFolder));
        when(googleDriveSyncService.listFilesInFolder("dist-1")).thenReturn(List.of(freeFolder));
        when(googleDriveSyncService.listFilesInFolder("free-1")).thenReturn(List.of(pdfFile));

        byte[] fileBytes = "Identical PDF File Content".getBytes();
        when(googleDriveSyncService.downloadFile("pdf-file-1")).thenReturn(new ByteArrayInputStream(fileBytes));

        String freeS3Key = "maharashtra/akola/free/AkolaNotes.pdf";
        when(s3Service.uploadFileWithKey(any(), anyLong(), eq(freeS3Key), eq("application/pdf"))).thenReturn(freeS3Key);
        when(s3Service.getS3Url(freeS3Key)).thenReturn("https://s3/" + freeS3Key);

        // First Ingestion: FREE
        pipelineTask.syncDriveToS3(true);

        Product initial = productRepo.findByGoogleDriveFileId("pdf-file-1");
        assertNotNull(initial);
        assertTrue(initial.isFree());
        assertEquals(0.0, initial.getPrice());
        assertEquals(freeS3Key, initial.getS3Key());

        // Move to PAID folder on Drive (same driveId and checksum)
        File paidFolder = mkFolder("paid-1", "Paid Resources");
        when(googleDriveSyncService.listFilesInFolder("dist-1")).thenReturn(List.of(paidFolder));
        when(googleDriveSyncService.listFilesInFolder("paid-1")).thenReturn(List.of(pdfFile));
        when(googleDriveSyncService.downloadFile("pdf-file-1")).thenReturn(new ByteArrayInputStream(fileBytes));

        String paidS3Key = "maharashtra/akola/paid/AkolaNotes.pdf";
        when(s3Service.doesObjectExist(freeS3Key)).thenReturn(true);
        when(s3Service.doesObjectExist(paidS3Key)).thenReturn(true);
        when(s3Service.getS3Url(paidS3Key)).thenReturn("https://s3/" + paidS3Key);

        // Second Ingestion: Move to PAID
        pipelineTask.syncDriveToS3(true);

        Product updated = productRepo.findByGoogleDriveFileId("pdf-file-1");
        assertNotNull(updated);
        assertFalse(updated.isFree(), "Product must be updated to FREE=false after Drive parent move");
        assertEquals(99.0, updated.getPrice(), "Price must be updated to 99.0");
        assertEquals(paidS3Key, updated.getS3Key(), "S3 key must be updated to paid path");

        // Verify S3 copy and delete were executed for relocation
        verify(s3Service, times(1)).copyObject(freeS3Key, paidS3Key);
        verify(s3Service, times(1)).deleteObject(freeS3Key);
    }

    // ── 3. DRIVE PARENT CHANGE (PAID -> FREE WITH SAME CHECKSUM) ──────────────
    @Test
    void testDriveParentChangePaidToFreeSameChecksum() throws Exception {
        File stateFolder = mkFolder("st-2", "Manipur");
        File distFolder = mkFolder("dist-2", "Chandel District");
        File paidFolder = mkFolder("paid-2", "Paid  Resources");
        File pdfFile = mkFile("pdf-file-2", "ChandelGuide.pdf", "application/pdf", 2048L);

        when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));
        when(googleDriveSyncService.listFilesInFolder("st-2")).thenReturn(List.of(distFolder));
        when(googleDriveSyncService.listFilesInFolder("dist-2")).thenReturn(List.of(paidFolder));
        when(googleDriveSyncService.listFilesInFolder("paid-2")).thenReturn(List.of(pdfFile));

        byte[] fileBytes = "Manipur PDF Data".getBytes();
        when(googleDriveSyncService.downloadFile("pdf-file-2")).thenReturn(new ByteArrayInputStream(fileBytes));

        String paidS3Key = "manipur/chandel/paid/ChandelGuide.pdf";
        when(s3Service.uploadFileWithKey(any(), anyLong(), eq(paidS3Key), eq("application/pdf"))).thenReturn(paidS3Key);
        when(s3Service.getS3Url(paidS3Key)).thenReturn("https://s3/" + paidS3Key);

        pipelineTask.syncDriveToS3(true);

        Product initial = productRepo.findByGoogleDriveFileId("pdf-file-2");
        assertNotNull(initial);
        assertFalse(initial.isFree());
        assertEquals(99.0, initial.getPrice());

        // Move to FREE folder
        File freeFolder = mkFolder("free-2", "Free Resources");
        when(googleDriveSyncService.listFilesInFolder("dist-2")).thenReturn(List.of(freeFolder));
        when(googleDriveSyncService.listFilesInFolder("free-2")).thenReturn(List.of(pdfFile));
        when(googleDriveSyncService.downloadFile("pdf-file-2")).thenReturn(new ByteArrayInputStream(fileBytes));

        String freeS3Key = "manipur/chandel/free/ChandelGuide.pdf";
        when(s3Service.doesObjectExist(paidS3Key)).thenReturn(true);
        when(s3Service.doesObjectExist(freeS3Key)).thenReturn(true);
        when(s3Service.getS3Url(freeS3Key)).thenReturn("https://s3/" + freeS3Key);

        pipelineTask.syncDriveToS3(true);

        Product updated = productRepo.findByGoogleDriveFileId("pdf-file-2");
        assertNotNull(updated);
        assertTrue(updated.isFree());
        assertEquals(0.0, updated.getPrice());
        assertEquals(freeS3Key, updated.getS3Key());

        verify(s3Service, times(1)).copyObject(paidS3Key, freeS3Key);
        verify(s3Service, times(1)).deleteObject(paidS3Key);
    }

    // ── 4. CONFLICTING ANCESTOR PATH IS QUARANTINED ──────────────────────────
    @Test
    void testConflictingAncestorPathQuarantinesFile() throws Exception {
        File stateFolder = mkFolder("st-3", "Assam");
        File freeFolder = mkFolder("free-3", "Free Resources");
        File paidFolder = mkFolder("paid-3", "Paid Resources");
        File pdfFile = mkFile("pdf-file-3", "Conflict.pdf", "application/pdf", 100L);

        when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));
        when(googleDriveSyncService.listFilesInFolder("st-3")).thenReturn(List.of(freeFolder));
        when(googleDriveSyncService.listFilesInFolder("free-3")).thenReturn(List.of(paidFolder));
        when(googleDriveSyncService.listFilesInFolder("paid-3")).thenReturn(List.of(pdfFile));
        when(googleDriveSyncService.downloadFile("pdf-file-3"))
                .thenReturn(new ByteArrayInputStream("conflict bytes".getBytes()));

        pipelineTask.syncDriveToS3(true);

        List<Product> products = productRepo.findAll();
        assertEquals(0, products.size(), "Conflicting tier folders must NOT create active products in Mongo");
        verify(s3Service, never()).uploadFileWithKey(any(), anyLong(), anyString(), anyString());
    }

    // ── 5. CANONICAL FOLDER NORMALIZATION VARIATIONS ─────────────────────────
    @Test
    void testCanonicalFolderNormalizationVariations() {
        assertTrue(ProductMetadataUtil.isFreeFolder("  FREE RESOURCES  "));
        assertTrue(ProductMetadataUtil.isFreeFolder("Free  Resources"));
        assertTrue(ProductMetadataUtil.isFreeFolder("free-resources"));
        assertTrue(ProductMetadataUtil.isFreeFolder("FREE NOTES"));
        assertTrue(ProductMetadataUtil.isFreeFolder("free resource"));

        assertTrue(ProductMetadataUtil.isPaidFolder("  PAID RESOURCES  "));
        assertTrue(ProductMetadataUtil.isPaidFolder("Paid  Resources"));
        assertTrue(ProductMetadataUtil.isPaidFolder("paid-resources"));
        assertTrue(ProductMetadataUtil.isPaidFolder("PAID MATERIALS"));
        assertTrue(ProductMetadataUtil.isPaidFolder("paid resource"));

        assertTrue(ProductMetadataUtil.isStateImagesFolder("State Images"));
        assertTrue(ProductMetadataUtil.isStateImagesFolder("state-images"));
        assertTrue(ProductMetadataUtil.isStateImagesFolder("state_images"));
        assertFalse(ProductMetadataUtil.isStateImagesFolder("Images"),
                "Standalone 'Images' folder must NOT be auto-classified as state images folder");
    }

    // ── 6. EDUCATIONAL SUBFOLDER NAMED IMAGES NOT STATE IMAGE ─────────────────
    @Test
    void testEducationalSubfolderNamedImagesNotStateImage() {
        List<String> path = List.of("State 1- Andhra Pradesh", "District 51- Alluri", "History", "Images",
                "Free Resources");
        HierarchicalMetadata meta = ProductMetadataUtil.extractMetadata(path, "map_diagram.png");

        assertEquals(ItemType.RESOURCE, meta.itemType,
                "Educational image file in Free Resources folder must be RESOURCE");
        assertEquals(AccessType.FREE, meta.accessType);
        assertTrue(meta.isFree);
        assertEquals("andhra-pradesh", meta.stateSlug);
        assertEquals("alluri", meta.districtSlug);
    }

    // ── 7. TEST B: S3 COPY FAILS ─────────────────────────────────────────────
    @Test
    void testS3CopyFailsMongoUnchangedOldKeyRetained() throws Exception {
        File stateFolder = mkFolder("st-fail-1", "Maharashtra");
        File distFolder = mkFolder("dist-fail-1", "Akola District");
        File freeFolder = mkFolder("free-fail-1", "Free Resources");
        File pdfFile = mkFile("pdf-file-fail-1", "FailNotes.pdf", "application/pdf", 1024L);

        when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));
        when(googleDriveSyncService.listFilesInFolder("st-fail-1")).thenReturn(List.of(distFolder));
        when(googleDriveSyncService.listFilesInFolder("dist-fail-1")).thenReturn(List.of(freeFolder));
        when(googleDriveSyncService.listFilesInFolder("free-fail-1")).thenReturn(List.of(pdfFile));

        byte[] fileBytes = "Fail PDF Content".getBytes();
        when(googleDriveSyncService.downloadFile("pdf-file-fail-1")).thenReturn(new ByteArrayInputStream(fileBytes));

        String freeS3Key = "maharashtra/akola/free/FailNotes.pdf";
        when(s3Service.uploadFileWithKey(any(), anyLong(), eq(freeS3Key), eq("application/pdf"))).thenReturn(freeS3Key);
        when(s3Service.getS3Url(freeS3Key)).thenReturn("https://s3/" + freeS3Key);

        pipelineTask.syncDriveToS3(true);

        Product initial = productRepo.findByGoogleDriveFileId("pdf-file-fail-1");
        assertNotNull(initial);
        assertTrue(initial.isFree());
        assertEquals(freeS3Key, initial.getS3Key());

        // Move to Paid on Drive, but simulate S3 copy throwing exception
        File paidFolder = mkFolder("paid-fail-1", "Paid Resources");
        when(googleDriveSyncService.listFilesInFolder("dist-fail-1")).thenReturn(List.of(paidFolder));
        when(googleDriveSyncService.listFilesInFolder("paid-fail-1")).thenReturn(List.of(pdfFile));

        String paidS3Key = "maharashtra/akola/paid/FailNotes.pdf";
        when(s3Service.doesObjectExist(freeS3Key)).thenReturn(true);
        doThrow(new RuntimeException("S3 Copy Network Error")).when(s3Service).copyObject(freeS3Key, paidS3Key);

        // Pipeline task catches individual file error safely
        pipelineTask.syncDriveToS3(true);

        Product afterFail = productRepo.findByGoogleDriveFileId("pdf-file-fail-1");
        assertNotNull(afterFail);
        assertTrue(afterFail.isFree(), "Product must remain free when S3 copy fails");
        assertEquals(freeS3Key, afterFail.getS3Key(), "Mongo S3 key must remain pointing to old key");
        verify(s3Service, never()).deleteObject(freeS3Key);
    }

    // ── 8. TEST C: S3 DESTINATION VERIFICATION FAILS ─────────────────────────
    @Test
    void testS3DestinationVerificationFailsMongoUnchanged() throws Exception {
        File stateFolder = mkFolder("st-fail-2", "Maharashtra");
        File distFolder = mkFolder("dist-fail-2", "Akola District");
        File freeFolder = mkFolder("free-fail-2", "Free Resources");
        File pdfFile = mkFile("pdf-file-fail-2", "VerifyFail.pdf", "application/pdf", 1024L);

        when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));
        when(googleDriveSyncService.listFilesInFolder("st-fail-2")).thenReturn(List.of(distFolder));
        when(googleDriveSyncService.listFilesInFolder("dist-fail-2")).thenReturn(List.of(freeFolder));
        when(googleDriveSyncService.listFilesInFolder("free-fail-2")).thenReturn(List.of(pdfFile));

        byte[] fileBytes = "Verify Fail PDF".getBytes();
        when(googleDriveSyncService.downloadFile("pdf-file-fail-2")).thenReturn(new ByteArrayInputStream(fileBytes));

        String freeS3Key = "maharashtra/akola/free/VerifyFail.pdf";
        when(s3Service.uploadFileWithKey(any(), anyLong(), eq(freeS3Key), eq("application/pdf"))).thenReturn(freeS3Key);
        when(s3Service.getS3Url(freeS3Key)).thenReturn("https://s3/" + freeS3Key);

        pipelineTask.syncDriveToS3(true);

        // Move to Paid on Drive, copy succeeds but destination check returns false
        File paidFolder = mkFolder("paid-fail-2", "Paid Resources");
        when(googleDriveSyncService.listFilesInFolder("dist-fail-2")).thenReturn(List.of(paidFolder));
        when(googleDriveSyncService.listFilesInFolder("paid-fail-2")).thenReturn(List.of(pdfFile));

        String paidS3Key = "maharashtra/akola/paid/VerifyFail.pdf";
        when(s3Service.doesObjectExist(freeS3Key)).thenReturn(true);
        when(s3Service.doesObjectExist(paidS3Key)).thenReturn(false); // Destination check fails!

        pipelineTask.syncDriveToS3(true);

        Product afterFail = productRepo.findByGoogleDriveFileId("pdf-file-fail-2");
        assertNotNull(afterFail);
        assertTrue(afterFail.isFree(), "Product must remain free when destination verification fails");
        assertEquals(freeS3Key, afterFail.getS3Key(), "Mongo S3 key must remain pointing to old key");
        verify(s3Service, never()).deleteObject(freeS3Key);
    }

    // ── 9. TEST D: S3 COPY SUCCEEDS, MONGO SAVE FAILS (OLD KEY NOT DELETED) ──
    @Test
    void testS3CopySucceedsMongoSaveFailsOldKeyNOTDeleted() throws Exception {
        File stateFolder = mkFolder("st-fail-3", "Maharashtra");
        File distFolder = mkFolder("dist-fail-3", "Akola District");
        File freeFolder = mkFolder("free-fail-3", "Free Resources");
        File pdfFile = mkFile("pdf-file-fail-3", "MongoSaveFail.pdf", "application/pdf", 1024L);

        when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));
        when(googleDriveSyncService.listFilesInFolder("st-fail-3")).thenReturn(List.of(distFolder));
        when(googleDriveSyncService.listFilesInFolder("dist-fail-3")).thenReturn(List.of(freeFolder));
        when(googleDriveSyncService.listFilesInFolder("free-fail-3")).thenReturn(List.of(pdfFile));

        byte[] fileBytes = "Mongo Save Fail PDF".getBytes();
        when(googleDriveSyncService.downloadFile("pdf-file-fail-3")).thenReturn(new ByteArrayInputStream(fileBytes));

        String freeS3Key = "maharashtra/akola/free/MongoSaveFail.pdf";
        when(s3Service.uploadFileWithKey(any(), anyLong(), eq(freeS3Key), eq("application/pdf"))).thenReturn(freeS3Key);
        when(s3Service.getS3Url(freeS3Key)).thenReturn("https://s3/" + freeS3Key);

        pipelineTask.syncDriveToS3(true);

        Product initial = productRepo.findByGoogleDriveFileId("pdf-file-fail-3");
        assertNotNull(initial);
        assertTrue(initial.isFree());
        assertEquals(freeS3Key, initial.getS3Key());

        // Move to Paid on Drive, copy succeeds, destination verifies
        File paidFolder = mkFolder("paid-fail-3", "Paid Resources");
        when(googleDriveSyncService.listFilesInFolder("dist-fail-3")).thenReturn(List.of(paidFolder));
        when(googleDriveSyncService.listFilesInFolder("paid-fail-3")).thenReturn(List.of(pdfFile));

        String paidS3Key = "maharashtra/akola/paid/MongoSaveFail.pdf";
        when(s3Service.doesObjectExist(freeS3Key)).thenReturn(true);
        when(s3Service.doesObjectExist(paidS3Key)).thenReturn(true);

        // Delete Mongo record prior to relocation step to simulate Mongo save failure
        // or database write conflict
        productRepo.delete(initial);

        pipelineTask.syncDriveToS3(true);

        // Verify that old S3 object was NEVER deleted because Mongo persistence was
        // compromised
        verify(s3Service, never()).deleteObject(freeS3Key);
    }
}
