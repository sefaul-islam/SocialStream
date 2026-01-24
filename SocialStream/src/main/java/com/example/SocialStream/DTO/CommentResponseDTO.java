package com.example.SocialStream.DTO;


import com.example.SocialStream.entities.Comments;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CommentResponseDTO {


     private Long id;
     private String content;
     private  String authorUsername;

     public CommentResponseDTO(Comments comment){
         this.id = comment.getId();
         this.content = comment.getContent();
         this.authorUsername = comment.getUser().getUsername();
     }



}
