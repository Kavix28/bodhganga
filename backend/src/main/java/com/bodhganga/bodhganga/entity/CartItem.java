package com.bodhganga.bodhganga.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

/**
 * Represents a single item in a user's shopping cart.
 * Persisted to MongoDB for logged-in users.
 * Guests use localStorage; cart is merged on login.
 */
@Document(collection = "cart_items")
public class CartItem {

    @Id
    private String id;

    private String userId;
    private String productId;

    /**
     * "COURSE" or "PRODUCT"
     */
    private String productType;

    private Date addedAt;

    public CartItem() {
        this.addedAt = new Date();
    }

    public CartItem(String userId, String productId, String productType) {
        this.userId = userId;
        this.productId = productId;
        this.productType = productType;
        this.addedAt = new Date();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getProductType() { return productType; }
    public void setProductType(String productType) { this.productType = productType; }

    public Date getAddedAt() { return addedAt; }
    public void setAddedAt(Date addedAt) { this.addedAt = addedAt; }
}
