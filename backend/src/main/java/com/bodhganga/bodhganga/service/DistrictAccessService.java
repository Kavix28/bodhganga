package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.entity.Purchase;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.PurchaseRepo;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
public class DistrictAccessService {

    private final PurchaseRepo purchaseRepo;

    public DistrictAccessService(PurchaseRepo purchaseRepo) {
        this.purchaseRepo = purchaseRepo;
    }

    /**
     * Authoritative check verifying whether a specific user has active lifetime
     * access
     * to the complete question bank for a specific district.
     */
    public boolean hasLifetimeDistrictAccess(String userId, String districtSlug) {
        if (userId == null || userId.isBlank() || "anonymous".equalsIgnoreCase(userId) || districtSlug == null
                || districtSlug.isBlank()) {
            return false;
        }
        String normDistrict = districtSlug.trim().toLowerCase(Locale.ROOT);
        List<Purchase> purchases = purchaseRepo.findByUserId(userId);
        return purchases.stream().anyMatch(p -> {
            String pDist = p.getDistrictSlug() != null ? p.getDistrictSlug().trim().toLowerCase(Locale.ROOT) : "";
            return normDistrict.equals(pDist);
        });
    }

    /**
     * Checks whether user has lifetime district access or holds administrator
     * privileges.
     */
    public boolean hasAccessOrIsAdmin(User user, String districtSlug) {
        if (user == null) {
            return false;
        }
        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            return true;
        }
        return hasLifetimeDistrictAccess(user.getId(), districtSlug);
    }
}
