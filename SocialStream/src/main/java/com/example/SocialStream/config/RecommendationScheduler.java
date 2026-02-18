package com.example.SocialStream.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.example.SocialStream.utils.JwtUtil;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecommendationScheduler {

    private final RestTemplate restTemplate;
    private final JwtUtil jwtUtil;

    @Value("${fastapi.service.url:http://localhost:8001}")
    private String fastApiUrl;

    /**
     * Scheduled task to train the recommendation model daily at 2 AM
     * Cron expression: second minute hour day month weekday
     * 0 0 2 * * ? = Every day at 2:00 AM
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void trainRecommendationModel() {
        log.info("Starting scheduled recommendation model training...");
        
        try {
            // Create JWT token for authentication
            // Using a service token for system-to-system communication
            String token = jwtUtil.generateServiceToken("recommendation-scheduler");
            
            // Prepare request
            String url = fastApiUrl + "/train";
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + token);
            headers.set("Content-Type", "application/json");
            
            // Request body with 90 days lookback
            String requestBody = "{\"days_lookback\": 90}";
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
            
            // Call FastAPI training endpoint
            log.info("Calling FastAPI training endpoint: {}", url);
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Model training completed successfully: {}", response.getBody());
            } else {
                log.error("Model training failed with status: {}", response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("Error during scheduled model training: {}", e.getMessage(), e);
        }
    }

    /**
     * Manual trigger for immediate training (for testing)
     * Can be called via endpoint if needed
     */
    public void triggerManualTraining() {
        log.info("Manual training triggered");
        trainRecommendationModel();
    }
}
