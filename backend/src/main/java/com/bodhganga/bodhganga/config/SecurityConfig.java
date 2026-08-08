package com.bodhganga.bodhganga.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public auth endpoints
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/register",
                                "/api/auth/health",
                                "/api/auth/admin/login",
                                "/api/auth/**",
                                "/api/admin/system/**",
                                "/api/admin/recovery/**",
                                "/error",
                                "/actuator/health"
                        ).permitAll()
                        // Public course reads
                        .requestMatchers("/api/courses/list", "/api/courses/category/**").permitAll()
                        // Public blog reads
                        .requestMatchers("/api/blog/posts", "/api/blog/posts/search", "/api/blog/**").permitAll()
                        // Public states reads
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/states/**").permitAll()
                        // Public content reads
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/content/**").permitAll()
                        // Public video reads
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/videos/**").permitAll()
                        // Public products (Digital Marketplace)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/products/**").permitAll()
                        // Public Test Series catalog reads
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/test-series/**").permitAll()

                        // Question Bank — catalog and search are public; test execution and dashboard require auth
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/question-bank/tests").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/question-bank/tests/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/question-bank/search").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/question-bank/tests/*/submit").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/question-bank/dashboard").authenticated()

                        // Test Execution, Evaluation & Analytics — require authentication
                        .requestMatchers("/api/test-execution/**").authenticated()
                        .requestMatchers("/api/test-evaluation/**").authenticated()
                        .requestMatchers("/api/test-analytics/**").authenticated()

                        // AI companion — general is public, study requires auth
                        .requestMatchers("/api/ai/general").permitAll()
                        .requestMatchers("/api/ai/study").authenticated()
                        .requestMatchers("/api/payment/webhook", "/api/payment/check-purchase/**").permitAll()
                        .requestMatchers("/api/payment/**").authenticated()

                        // Cart — count is public (returns 0 for guests), rest requires auth
                        .requestMatchers("/api/cart/count").permitAll()
                        .requestMatchers("/api/cart/**").authenticated()

                        // User orders — require auth
                        .requestMatchers("/api/orders").authenticated()

                        // Admin orders — require ADMIN role
                        .requestMatchers("/api/admin/orders/**").hasAuthority("ROLE_ADMIN")

                        // Dashboard admin-stats is called with admin token; revenue/content/storage same
                        .requestMatchers("/api/dashboard/admin-stats").authenticated()
                        .requestMatchers("/api/dashboard/revenue").authenticated()
                        .requestMatchers("/api/dashboard/content").authenticated()
                        .requestMatchers("/api/dashboard/storage").authenticated()

                        // Protected user endpoints
                        .requestMatchers("/api/quiz/**").authenticated()
                        .requestMatchers("/api/dashboard/**").authenticated()
                        .requestMatchers("/api/profile/**").authenticated()
                        .requestMatchers("/api/courses/enroll/**").authenticated()
                        .requestMatchers("/api/courses/my-courses").authenticated()
                        .requestMatchers("/api/courses/**").authenticated()

                        // Admin write endpoints — MUST have ADMIN role
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/states/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/states/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/states/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/blog/posts/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/blog/posts/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/blog/posts/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/content/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/content/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/content/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")

                        // Disallow everything else
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Known production origins — always allowed
        java.util.List<String> origins = new java.util.ArrayList<>(java.util.List.of(
            "http://localhost:5173",
            "http://localhost:3000",
            "https://bodhganga.in",
            "https://www.bodhganga.in"
        ));

        // Additional origins injected at runtime (e.g., staging, specific Vercel deployment URL)
        String envOrigins = System.getenv("ALLOWED_ORIGINS");
        if (envOrigins != null && !envOrigins.isBlank()) {
            for (String origin : envOrigins.split(",")) {
                String trimmed = origin.trim();
                if (!trimmed.isEmpty() && !origins.contains(trimmed)) {
                    origins.add(trimmed);
                }
            }
        }

        configuration.setAllowedOriginPatterns(origins);
        configuration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        // Explicit header allowlist — no wildcard
        configuration.setAllowedHeaders(java.util.List.of(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin"
        ));
        configuration.setExposedHeaders(java.util.List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}


