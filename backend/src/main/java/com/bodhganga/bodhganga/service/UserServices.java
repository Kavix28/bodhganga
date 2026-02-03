package com.bodhganga.bodhganga.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.UserRepo;

@Component
public class UserServices {

    @Autowired
    private UserRepo userRepo;

    public void saveUser(User user) {
        userRepo.save(user);
    }

    public List<User> getAll() {
        return userRepo.findAll();
    }

    public User findByEmail(String email) {
        return userRepo.findByEmail(email).orElse(null);
    }

    public List<User> getCourses() {
        return userRepo.findAll();
    }
}
