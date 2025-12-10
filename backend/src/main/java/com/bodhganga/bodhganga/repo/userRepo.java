package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.User;
import lombok.NonNull;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public class userRepo
{
    public interface userRepository extends MongoRepository<@NonNull User, @NonNull String>
    {
        Optional<User> findByEmail(String email);
    }

}
