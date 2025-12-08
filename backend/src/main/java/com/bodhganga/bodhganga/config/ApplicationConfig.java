package com.bodhganga.bodhganga.config;

import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.userRepo;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class ApplicationConfig
{
    private final userRepo userRepo;

    public ApplicationConfig(userRepo userRepo) {
        this.userRepo = userRepo;
    }

    @Bean
    public PasswordEncoder PasswordEndoderTool()
    {
        return new BCryptPasswordEncoder();
    }
}
