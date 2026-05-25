package com.bodhganga.bodhganga.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * OTP Service — in-memory store with expiry + rate limiting.
 * For production scale: replace ConcurrentHashMap with Redis.
 */
@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);

    private static final int OTP_LENGTH = 6;
    private static final long OTP_EXPIRY_MS = 10 * 60 * 1000L;      // 10 minutes
    private static final long RESEND_COOLDOWN_MS = 60 * 1000L;       // 1 minute
    private static final int MAX_ATTEMPTS = 5;

    private final JavaMailSender mailSender;

    // email → OtpEntry
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    public OtpService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // ── Public API ────────────────────────────────────────────────

    /**
     * Generate and send OTP to email.
     * Returns error message if on cooldown, null on success.
     */
    public String sendOtp(String email) {
        OtpEntry existing = otpStore.get(email);
        if (existing != null) {
            long elapsed = Instant.now().toEpochMilli() - existing.createdAt;
            if (elapsed < RESEND_COOLDOWN_MS) {
                long wait = (RESEND_COOLDOWN_MS - elapsed) / 1000;
                return "Please wait " + wait + " seconds before requesting a new OTP.";
            }
        }

        String otp = generateOtp();
        otpStore.put(email, new OtpEntry(otp, Instant.now().toEpochMilli()));
        CompletableFuture.runAsync(() -> sendOtpEmail(email, otp));
        log.info("OTP sent to {}", email);
        return null; // success
    }

    /**
     * Verify OTP for email.
     * Returns null on success, error message on failure.
     */
    public String verifyOtp(String email, String inputOtp) {
        OtpEntry entry = otpStore.get(email);

        if (entry == null) {
            return "No OTP found. Please request a new one.";
        }

        if (entry.attempts >= MAX_ATTEMPTS) {
            otpStore.remove(email);
            return "Too many failed attempts. Please request a new OTP.";
        }

        long elapsed = Instant.now().toEpochMilli() - entry.createdAt;
        if (elapsed > OTP_EXPIRY_MS) {
            otpStore.remove(email);
            return "OTP has expired. Please request a new one.";
        }

        if (!entry.otp.equals(inputOtp.trim())) {
            entry.attempts++;
            int remaining = MAX_ATTEMPTS - entry.attempts;
            return "Invalid OTP. " + remaining + " attempt(s) remaining.";
        }

        // Success — remove from store
        otpStore.remove(email);
        return null;
    }

    // ── Private Helpers ───────────────────────────────────────────

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int num = 100000 + random.nextInt(900000);
        return String.valueOf(num);
    }

    @Async
    protected void sendOtpEmail(String email, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("BodhGanga — Your Verification Code");
            message.setText(
                "Dear Scholar,\n\n" +
                "Your BodhGanga verification code is:\n\n" +
                "  " + otp + "\n\n" +
                "This code expires in 10 minutes.\n" +
                "Do not share this code with anyone.\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "— BodhGanga Academy"
            );
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", email, e.getMessage());
        }
    }

    // ── Inner Record ──────────────────────────────────────────────

    private static class OtpEntry {
        final String otp;
        final long createdAt;
        int attempts = 0;

        OtpEntry(String otp, long createdAt) {
            this.otp = otp;
            this.createdAt = createdAt;
        }
    }
}
