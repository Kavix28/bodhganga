package com.bodhganga.bodhganga.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import java.util.concurrent.CompletableFuture;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOrderConfirmation(String toEmail, String orderId, String productName) {
        CompletableFuture.runAsync(() -> {
            try {
                String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));
                String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><style>body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}.container{max-width:560px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)}.header{background:#064e3b;padding:32px;text-align:center}.header h1{color:#fff;margin:0;font-size:22px;font-weight:700}.header p{color:#6ee7b7;margin:6px 0 0;font-size:13px}.badge{background:#10b981;color:#fff;display:inline-block;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;margin:20px auto;letter-spacing:1px}.body{padding:28px 32px}.amount{text-align:center;padding:20px 0}.amount .rs{font-size:36px;font-weight:800;color:#064e3b}.amount .label{font-size:12px;color:#6b7280;margin-top:4px}.receipt{background:#f9fafb;border-radius:10px;padding:20px;margin:20px 0}.receipt-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:13px}.receipt-row:last-child{border-bottom:none;font-weight:700;color:#064e3b}.receipt-row .label{color:#6b7280}.receipt-row .value{font-weight:600;color:#111827;max-width:200px;text-align:right;word-break:break-all}.footer{background:#f9fafb;padding:20px 32px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb}.btn{display:inline-block;background:#064e3b;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;margin:16px 0}</style></head><body><div class='container'><div class='header'><h1>Bodhganga Academy</h1><p>Where Knowledge Takes Root</p></div><div class='body'><div style='text-align:center'><span class='badge'>PAYMENT SUCCESSFUL</span></div><div class='amount'><div class='rs'>&#8377;99</div><div class='label'>District Study Pack Unlocked</div></div><div class='receipt'><div class='receipt-row'><span class='label'>Product</span><span class='value'>" + productName + "</span></div><div class='receipt-row'><span class='label'>Order ID</span><span class='value'>" + orderId + "</span></div><div class='receipt-row'><span class='label'>Date</span><span class='value'>" + date + "</span></div><div class='receipt-row'><span class='label'>Payment Mode</span><span class='value'>Razorpay</span></div><div class='receipt-row'><span class='label'>Status</span><span class='value' style='color:#10b981'>PAID</span></div><div class='receipt-row'><span class='label'>Amount Paid</span><span class='value'>&#8377;99.00</span></div></div><p style='font-size:13px;color:#374151;text-align:center'>You can now access all paid resources for this district from your dashboard.</p><div style='text-align:center'><a class='btn' href='https://www.bodhganga.in/states-browse'>Access Resources</a></div></div><div class='footer'><p>Need help? Email us at <a href='mailto:support@bodhganga.in' style='color:#064e3b'>support@bodhganga.in</a></p><p style='margin-top:8px'>2025 Bodhganga Academy. All rights reserved.</p></div></div></body></html>";

                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                helper.setTo(toEmail);
                helper.setSubject("Payment Receipt - " + productName + " | Bodhganga Academy");
                helper.setText(html, true);
                mailSender.send(mimeMessage);
                log.info("Receipt email sent to: {}", toEmail);
            } catch (Exception e) {
                log.error("Failed to send receipt email: {}", e.getMessage());
            }
        });
    }

    public void sendInvoice(String toEmail, String orderId, String pdfUrl) {
        CompletableFuture.runAsync(() -> {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                helper.setTo(toEmail);
                helper.setSubject("Your Invoice - Order " + orderId + " | Bodhganga Academy");
                helper.setText("<div style='font-family:Arial,sans-serif;max-width:500px;margin:auto'><h2 style='color:#064e3b'>Your Invoice</h2><p>Dear Scholar,</p><p>Your invoice for Order <strong>" + orderId + "</strong> is ready.</p><p><a href='" + pdfUrl + "' style='background:#064e3b;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none'>Download Invoice</a></p><p style='color:#6b7280;font-size:12px;margin-top:20px'>Bodhganga Academy - support@bodhganga.in</p></div>", true);
                mailSender.send(mimeMessage);
            } catch (Exception e) {
                log.error("Failed to send invoice email: {}", e.getMessage());
            }
        });
    }

    public void sendWelcomeEmail(String toEmail, String name) {
        CompletableFuture.runAsync(() -> {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                helper.setTo(toEmail);
                helper.setSubject("Welcome to Bodhganga Academy!");
                helper.setText("<div style='font-family:Arial,sans-serif;max-width:500px;margin:auto'><div style='background:#064e3b;padding:24px;border-radius:12px 12px 0 0;text-align:center'><h1 style='color:#fff;margin:0;font-size:20px'>Welcome to Bodhganga Academy!</h1><p style='color:#6ee7b7;margin:6px 0 0;font-size:12px'>Where Knowledge Takes Root</p></div><div style='padding:24px;background:#fff;border-radius:0 0 12px 12px;border:1px solid #e5e7eb'><p style='color:#374151'>Dear <strong>" + name + "</strong>,</p><p style='color:#374151'>Welcome to Bodhganga Academy - India's premier platform for state PSC and civil services exam preparation.</p><div style='text-align:center;margin:20px 0'><a href='https://www.bodhganga.in/states-browse' style='background:#064e3b;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700'>Explore Now</a></div><p style='color:#9ca3af;font-size:11px;text-align:center'>Need help? support@bodhganga.in</p></div></div>", true);
                mailSender.send(mimeMessage);
                log.info("Welcome email sent to: {}", toEmail);
            } catch (Exception e) {
                log.error("Failed to send welcome email: {}", e.getMessage());
            }
        });
    }
}
