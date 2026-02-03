package com.bodhganga.bodhganga.entity;

import lombok.*;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
//@Getter
//@Setter
//@AllArgsConstructor
//@NoArgsConstructor
//@Component
@Document(collection = "users")
public class User
{
    @NonNull
    private String name;
    public @NonNull String getName() {return name;}
    public void setName(@NonNull String name) {this.name = name;}

    private String gender;

    @NonNull
    private Date dateOfBirth;
    public @NonNull Date getDateOfBirth() {return dateOfBirth;}
    public void setDateOfBirth(@NonNull Date dateOfBirth) {this.dateOfBirth = dateOfBirth;}


    @Indexed(unique = true)
    @NonNull
    private String email;
    public @NonNull String getEmail() {return email;}
    public void setEmail(@NonNull String email) {this.email = email;}


    private String hashedPassword;
    @Indexed(unique = true)
    @NonNull

    private String phoneNo;
    public @NonNull String getPhoneNo() {return phoneNo;}
    public void setPhoneNo(@NonNull String phoneNo) {this.phoneNo = phoneNo;}

    private String profilePicture;
    private String city;
    private String state;
    private String country;


    public String getName(String fName, String lName)
    {
       return fName+" "+lName;
    }

    @DBRef
    private List<Courses> courses = new ArrayList<>();

}
