package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public class userRepo
{
    public interface userRepo extends MongoRepository<User,String>
    {
        Optional<User> findByEmail(String email);
    }

}
