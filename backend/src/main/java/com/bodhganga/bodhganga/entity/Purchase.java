package com.bodhganga.bodhganga.entity;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Document(collection = "purchases")
public class Purchase {
    @Id
    private String id;
    private String userId;
    private String productId;
    private String orderId;
    private Date purchaseDate;
    private int downloadCount;
    private Double amountPaid;
    private String districtSlug;
    private String stateSlug;

    public Purchase() {
        this.purchaseDate = new Date();
        this.downloadCount = 0;
        this.amountPaid = 0.0;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public Date getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(Date purchaseDate) { this.purchaseDate = purchaseDate; }
    public int getDownloadCount() { return downloadCount; }
    public void setDownloadCount(int downloadCount) { this.downloadCount = downloadCount; }
    public Double getAmountPaid() { return amountPaid; }
    public void setAmountPaid(Double amountPaid) { this.amountPaid = amountPaid; }
    public String getDistrictSlug() { return districtSlug; }
    public void setDistrictSlug(String districtSlug) { this.districtSlug = districtSlug; }
    public String getStateSlug() { return stateSlug; }
    public void setStateSlug(String stateSlug) { this.stateSlug = stateSlug; }
}
