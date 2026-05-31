package com.bodhganga.bodhganga.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Document(collection = "payments")
public class Payment {
    @Id
    private String id;
    
    private String userId;
    private String courseId;
    private String orderId;
    private String paymentId;
    private Double amount;
    private String currency;
    private String status; // PENDING, SUCCESS, FAILED
    private Date createdAt;

    public Payment() {
        this.createdAt = new Date();
        this.status = "PENDING";
    }

    public Payment(String userId, String courseId, String orderId, Double amount, String currency) {
        this.userId = userId;
        this.courseId = courseId;
        this.orderId = orderId;
        this.amount = amount;
        this.currency = currency;
        this.status = "PENDING";
        this.createdAt = new Date();
    }

    // Manual Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}
