package com.bodhganga.bodhganga.controllers;

import java.util.List;

import com.bodhganga.bodhganga.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;
import com.bodhganga.bodhganga.entity.Courses;
import com.bodhganga.bodhganga.service.UserServices;

@Component
@RestController
@RequestMapping("/profile")
public class UserController
{
    @Autowired
    private UserServices userServices;
    @GetMapping()
    public void getProfile()
    {
        return ;
    }
    @GetMapping("/my-courses")
    public List<Courses> getCourses()
    {
        try{
            return userServices.getCourses();
        } catch (Exception e) {
            throw new RuntimeException("Internal Server Error");
        }

    }
    @GetMapping("/edit-profile")
    public String getEditProfile()
    {
        return "";
    }
    @PostMapping("/edit-profile")
    public void editProfile()
    {
        return userServices.editProfile();
    }
    public String postEditProfile()
    {
        return "";
    }
    @GetMapping("/account-security")
    public String getAccountSecurity()
    {
        return "";
    }
    @GetMapping("/payment")
    public String getPayment()
    {
        return "";
    }
}
