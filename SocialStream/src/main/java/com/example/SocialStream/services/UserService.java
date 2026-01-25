package com.example.SocialStream.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.SocialStream.DTO.CreateUserDTO;
import com.example.SocialStream.DTO.PostResponseDTO;
import com.example.SocialStream.DTO.UserDTO;
import com.example.SocialStream.entities.Role;
import com.example.SocialStream.entities.User;
import com.example.SocialStream.enums.UserRole;
import com.example.SocialStream.exceptions.InvalidOperationException;
import com.example.SocialStream.exceptions.UserNotFoundException;
import com.example.SocialStream.repositories.PostRepository;
import com.example.SocialStream.repositories.RoleRepository;
import com.example.SocialStream.repositories.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder bCryptPasswordEncoder;
    private final RoleRepository roleRepository;
    private final PostRepository postRepository;

    public UserDTO registerUser(CreateUserDTO createUserDTO) {
        if (userRepository.findByEmail(createUserDTO.getEmail()).isPresent()) {
            throw new InvalidOperationException("Email already exists");
        }
        User user = new User();
        user.setEmail(createUserDTO.getEmail());
        user.setPassword(bCryptPasswordEncoder.encode(createUserDTO.getPassword()));
        user.setUsername(createUserDTO.getUsername());
        Role userRole = roleRepository.findByRole(UserRole.USER)
                .orElseThrow(() -> new InvalidOperationException("Default role USER not found"));
        user.getRoles().add(userRole);
        user.setUserRegistrationDate(LocalDateTime.now());
        User savedUser = userRepository.save(user);
        return new UserDTO(savedUser);
    }

    public List<PostResponseDTO> getUserPosts(Long userId) {
        // Verify user exists
        userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        // Get all posts for the user
        return postRepository.findByUserId(userId)
            .stream()
            .map(PostResponseDTO::new)
            .toList();
    }
    public User uploadProfilePicture(Long userId, String pictureUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        user.setProfilePictureUrl(pictureUrl);
        return userRepository.save(user);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));
    }

    public User getUserProfile(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
    }
}
