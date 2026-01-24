package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.Role;
import com.example.SocialStream.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByRole(UserRole role);
}
