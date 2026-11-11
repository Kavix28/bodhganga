package com.bodhganga.bodhganga.repositories;

import com.bodhganga.bodhganga.models.SiteMetric;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SiteMetricRepository extends MongoRepository<SiteMetric, String> {
}

