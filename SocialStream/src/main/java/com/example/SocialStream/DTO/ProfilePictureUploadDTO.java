package com.example.SocialStream.DTO;

/**
 * DTO for profile picture upload requests
 */
public class ProfilePictureUploadDTO {
    private String profilePictureUrl;

    // Constructors
    public ProfilePictureUploadDTO() {
    }

    public ProfilePictureUploadDTO(String profilePictureUrl) {
        this.profilePictureUrl = profilePictureUrl;
    }

    // Getters and Setters
    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }

    public void setProfilePictureUrl(String profilePictureUrl) {
        this.profilePictureUrl = profilePictureUrl;
    }
}
