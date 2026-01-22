package com.example.SocialStream.config;

import com.example.SocialStream.utils.JwtUtil;
import io.jsonwebtoken.Claims;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;

    public WebSocketAuthInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Extract JWT token from Authorization header
            List<String> authorization = accessor.getNativeHeader("Authorization");
            
            if (authorization != null && !authorization.isEmpty()) {
                String token = authorization.get(0);
                
                // Remove "Bearer " prefix if present
                if (token.startsWith("Bearer ")) {
                    token = token.substring(7);
                }

                try {
                    // Validate token
                    if (jwtUtil.isTokenValid(token)) {
                        // Extract claims from token
                        Claims claims = jwtUtil.getClaims(token);
                        String username = claims.getSubject(); // Email
                        
                        // Extract roles from token
                        @SuppressWarnings("unchecked")
                        List<String> roles = claims.get("roles", List.class);
                        List<SimpleGrantedAuthority> authorities = roles.stream()
                                .map(SimpleGrantedAuthority::new)
                                .collect(Collectors.toList());

                        // Create authentication object
                        UsernamePasswordAuthenticationToken authentication = 
                                new UsernamePasswordAuthenticationToken(username, null, authorities);
                        
                        // Set user in WebSocket session ONLY - do not set SecurityContext to avoid database queries
                        accessor.setUser(authentication);
                    }
                } catch (Exception e) {
                    System.err.println("WebSocket authentication failed: " + e.getMessage());
                }
            }
        }

        return message;
    }
}
