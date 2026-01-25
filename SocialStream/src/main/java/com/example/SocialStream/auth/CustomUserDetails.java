package com.example.SocialStream.auth;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.example.SocialStream.entities.User;

public class CustomUserDetails implements UserDetails {
    private final User users;

    public CustomUserDetails(User users) {
        this.users = users;
    }
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<GrantedAuthority> authorities = new HashSet<>();
        users.getRoles().forEach(role -> {
            authorities.add(() -> "ROLE_" + role.getRole());
        });
        return authorities;
    }

    @Override
    public @Nullable String getPassword() {
        return users.getPassword();
    }

    @Override
    public String getUsername() {
        return users.getEmail();
    }
    public String getEmail(){ return users.getEmail();}
    public long getUserId(){
        return users.getId();
    }
}
