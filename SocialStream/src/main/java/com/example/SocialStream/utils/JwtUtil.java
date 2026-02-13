package com.example.SocialStream.utils;
import com.example.SocialStream.auth.CustomUserDetails;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.stream.Collectors;

@Component
public class JwtUtil {
    @Value("${jwt.secret:DEFAULT_SECRET}")
    private String secret;
    @Value("${jwt.expiration:86400000}")
    private long jwtExpirationInMs;

    public String generateToken(CustomUserDetails user) {
        // Implementation for generating JWT token
        return Jwts
                .builder()
                .subject(user.getEmail())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationInMs))
                .claim("roles", user.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.toList()))
                .claim("id", user.getUserId())
                .claim("profilepicurl",user.getProfilePicUrl())
                .signWith(getSignInKey())
                .compact();
    }
    public Claims getClaims(String token) {
        try {
            return Jwts
                    .parser()
                    .verifyWith(getSignInKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            // Optionally log or handle it
            System.out.println("Token expired at: " + e.getClaims().getExpiration());
            throw e;
        }
    }
    public  boolean isTokenValid(String token){
        return !isExpired(token);
    }

    private   boolean isExpired(String token) {
        return getClaims(token)
                .getExpiration()
                .before(new Date());
    }

    private SecretKey getSignInKey(){

        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
