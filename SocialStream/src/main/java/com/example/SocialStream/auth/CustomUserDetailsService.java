package com.example.SocialStream.auth;

import com.example.SocialStream.entities.User;
import com.example.SocialStream.exceptions.UserNotFoundException;
import com.example.SocialStream.repositories.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service

public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
          User user = userRepository.findByEmail(email).orElseThrow(()-> new UserNotFoundException("User Not Found"));
            return new CustomUserDetails(user);
    }
}
