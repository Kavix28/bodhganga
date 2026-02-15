package com.bodhganga.bodhganga.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MongoConfig {

    @Bean
    public MongoClient mongoClient() {
        String connectionString = "mongodb+srv://bodh:ganga@test-bodhganga.30wadid.mongodb.net/bodhganga?retryWrites=true&w=majority&appName=test-bodhganga";
        System.out.println("==========================================================");
        System.out.println("FORCING MONGO CONNECTION TO: " + connectionString);
        System.out.println("==========================================================");
        return MongoClients.create(connectionString);
    }
}
