package com.bodhganga.bodhganga;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class BodhgangaApplication {

	public static void main(String[] args) {
		SpringApplication.run(BodhgangaApplication.class, args);
	}

}
