package com.bodhganga.bodhganga.config;

import org.springframework.boot.autoconfigure.mongo.MongoClientSettingsBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class MongoConfig {

    /**
     * Fast-fail cluster and socket timeouts.
     * Limits server selection to 5000ms so thread pools are not starved and frontend
     * receives immediate, clear error feedback rather than hitting the 15-second Axios timeout.
     */
    @Bean
    public MongoClientSettingsBuilderCustomizer mongoClientSettingsBuilderCustomizer() {
        return builder -> {
            builder.applyToClusterSettings(clusterSettings ->
                    clusterSettings.serverSelectionTimeout(5000, TimeUnit.MILLISECONDS)
            );
            builder.applyToSocketSettings(socketSettings -> {
                socketSettings.connectTimeout(5000, TimeUnit.MILLISECONDS);
                socketSettings.readTimeout(10000, TimeUnit.MILLISECONDS);
            });
        };
    }
}
