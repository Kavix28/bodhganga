package com.bodhganga.bodhganga.service;

import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import com.bodhganga.bodhganga.entity.Courses;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.userRepo;

@Service
@Component
public class UserServices {

    @Autowired
    private final userRepo userRepo;
    private User user;

    public UserServices(userRepo userRepo) {
        this.userRepo = userRepo;
    }

    /**
     * Returns courses purchased/enrolled by the user identified by email.
     * If the user is not found, returns an empty list.
     */
//    @Bean
    public List<Courses> getCourses() {

        String email = User.email();
        return userRepo.findByEmail(email)
                .map(User::getCourses)
                .orElse(Collections.emptyList());
    }

    public void
}
