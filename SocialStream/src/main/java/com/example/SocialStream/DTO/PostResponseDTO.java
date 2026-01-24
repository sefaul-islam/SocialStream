package com.example.SocialStream.DTO;

import com.example.SocialStream.entities.Post;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PostResponseDTO {
    private Long id;
    private String description;
    private LocalDateTime uploadDate;
    private UserDTO user;
    private MediaDTO media;
    private int likesCount;
    private List<CommentResponseDTO> comments;

    public PostResponseDTO(Post post){
        this.id = post.getId();
        this.description = post.getDescription();
        this.uploadDate = post.getUploadedAt();
        this.user = new UserDTO(post.getUser());
        this.media = new MediaDTO(post.getMedia());
        this.likesCount = post.getLikesCount();
        this.comments = post.getComments().stream()
                .map(CommentResponseDTO::new)
                .toList();
    }
}
