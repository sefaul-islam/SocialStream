package com.example.SocialStream;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SocialStreamApplication {

	public static void main(String[] args) {
		SpringApplication.run(SocialStreamApplication.class, args);
	}

}
