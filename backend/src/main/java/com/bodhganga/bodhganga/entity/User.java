package com.bodhganga.bodhganga.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "users")
public class User
{
    @NonNull
    private String fName;
    @NonNull
    private String lName;
    @NonNull
    private String gender;
    @NonNull
    private Date dateOfBirth;
    @Indexed(unique = true)
    @NonNull
    private String email;
    private String password;
    private String hashedPassword;
    @Indexed(unique = true)
    @NonNull
    private String phoneNo;
    private String profilePicture;
    @NonNull
    private String city;
    @NonNull
    private String state;
    @NonNull
    private String country;

    @DBRef
    private List<Courses> courses = new ArrayList<>();

}
