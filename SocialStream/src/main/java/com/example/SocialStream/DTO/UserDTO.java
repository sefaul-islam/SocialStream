package com.example.SocialStream.DTO;

import com.example.SocialStream.entities.Role;
import com.example.SocialStream.entities.User;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
public class UserDTO {
    private Long Id;
    private String username;
    private String email;
    private Set<Role> roles;
    private User.UserStatus status;
    private LocalDateTime userRegistrationDate;

    public UserDTO(User user){
        this.Id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.roles = user.getRoles();
        this.status = user.getStatus();
        this.userRegistrationDate = user.getUserRegistrationDate();
    }
}
