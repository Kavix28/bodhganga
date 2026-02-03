package com.bodhganga.bodhganga.controllers;

import java.util.List;

import com.bodhganga.bodhganga.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.bodhganga.bodhganga.service.UserServices;

@RestController
@RequestMapping("/profile")
public class UserController {
    @Autowired
    private UserServices userServices;

    @GetMapping
    public List<User> getUser() {
        return userServices.getAll();
    }

    @PostMapping
    public void createUser(@RequestBody User user) {
        userServices.saveUser(user);
    }

    @PutMapping
    public void updateUser(@RequestBody User user) {
        User userinDb = userServices.findByEmail(user.getEmail());
        // TODO: Implement update logic
    }

    // TODO: Fix these methods - they have compilation errors
    /*
     * @GetMapping()
     * public String getProfile()
     * {
     * return user.getName();
     * }
     * 
     * @GetMapping("/my-courses")
     * public List<Courses> getCourses()
     * {
     * try{
     * return userServices.getCourses();
     * } catch (Exception e) {
     * throw new RuntimeException("Internal Server Error");
     * }
     * }
     * 
     * @PostMapping("/edit-profile")
     * public void editProfile()
     * {
     * return userServices.editProfile();
     * }
     */

    @GetMapping("/edit-profile")
    public String getEditProfile() {
        return "Edit profile page";
    }

    @GetMapping("/account-security")
    public String getAccountSecurity() {
        return "Account security page";
    }

    @GetMapping("/payment")
    public String getPayment() {
        return "Payment page";
    }
}
