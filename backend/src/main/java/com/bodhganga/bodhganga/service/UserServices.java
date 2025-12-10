package com.bodhganga.bodhganga.service;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Service;

import com.bodhganga.bodhganga.entity.Courses;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.userRepo;

@Service
public class UserServices {

    private final userRepo userRepo;

    public UserServices(userRepo userRepo) {
        this.userRepo = userRepo;
    }

    public void signUp(User user) {
        userRepo.save(user);
    }

    public List<Courses> getCourses() {
        return userRepo.findByEmail(email)
                .map(User::getCourses)
                .orElse(Collections.emptyList());
    }
}
