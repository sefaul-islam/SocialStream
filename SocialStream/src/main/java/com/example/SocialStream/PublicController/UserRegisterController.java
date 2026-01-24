package com.example.SocialStream.PublicController;

import com.example.SocialStream.DTO.CreateUserDTO;
import com.example.SocialStream.DTO.UserDTO;
import com.example.SocialStream.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("public/api/v1/register")
@RequiredArgsConstructor
public class UserRegisterController {
    private final UserService userService;


    @PostMapping
    public ResponseEntity<UserDTO> registerUser(@RequestBody CreateUserDTO createUserDTO){
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.registerUser(createUserDTO));
    }
}
