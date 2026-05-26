package com.bodhganga.bodhganga.services;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import java.util.concurrent.CompletableFuture;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOrderConfirmation(String toEmail, String orderId, String productName) {
        CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject("Order Confirmation: " + productName);
                message.setText("Dear Scholar,\n\nYour purchase (" + orderId + ") for \"" + productName + "\" has been successfully processed.\n\nYou can now access your digital notes from your dashboard.\n\nThank you,\nBodhGanga Academy");
                mailSender.send(message);
            } catch (Exception e) {
                System.err.println("Failed to send email: " + e.getMessage());
            }
        });
    }

    public void sendInvoice(String toEmail, String orderId, String pdfUrl) {
        CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject("Your Invoice for Order " + orderId);
                message.setText("Dear Customer,\n\nYou can download your invoice using the secure link below:\n\n" + pdfUrl + "\n\nThank you,\nBodhGanga Team");
                mailSender.send(message);
            } catch (Exception e) {
                System.err.println("Failed to send email: " + e.getMessage());
            }
        });
    }

    public void sendWelcomeEmail(String toEmail, String name) {
        CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject("Welcome to BodhGanga Academy!");
                message.setText("Dear " + name + ",\n\nWelcome to BodhGanga Academy — India's Premium Exam Preparation and Heritage Learning Portal.\n\nWe are thrilled to accompany you on your journey to crack the civil services exams.\n\nBest regards,\nBodhGanga Academy");
                mailSender.send(message);
            } catch (Exception e) {
                System.err.println("Failed to send welcome email: " + e.getMessage());
            }
        });
    }
}
