package com.bodhganga.bodhganga.services;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOrderConfirmation(String toEmail, String orderId, String productName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Order Confirmation: " + productName);
        message.setText("Dear Customer,\n\nYour order (" + orderId + ") for " + productName + " has been successfully processed.\n\nYou can now access your digital downloads from your dashboard.\n\nThank you,\nBodhganga Team");
        
        try {
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
        }
    }

    public void sendInvoice(String toEmail, String orderId, String pdfUrl) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Your Invoice for Order " + orderId);
        message.setText("Dear Customer,\n\nYou can download your invoice using the secure link below:\n\n" + pdfUrl + "\n\nThank you,\nBodhganga Team");
        
        try {
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
        }
    }
}
