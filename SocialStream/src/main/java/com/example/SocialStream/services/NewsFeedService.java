package com.example.SocialStream.services;

import com.example.SocialStream.DTO.PostRequestDTO;
import com.example.SocialStream.DTO.PostResponseDTO;
import com.example.SocialStream.entities.Media;
import com.example.SocialStream.entities.Post;
import com.example.SocialStream.exceptions.UserNotFoundException;
import com.example.SocialStream.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NewsFeedService {
    private final MediaRepository mediaRepository;
    private final AudioRepository audioRepository;
    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final PostRepository postrepository;

    public PostResponseDTO createPostAudio(PostRequestDTO requestDTO,  Long audioId, Long userId) {

        Post post = new Post();
        post.setDescription(requestDTO.getDescription());
        post.setUploadedAt(LocalDateTime.now());
        post.setUser(userRepository.findById(userId).orElseThrow(()->new UserNotFoundException("User not found with id: "+userId)));
        Media audio  = audioRepository.findById(audioId).orElseThrow(()->new RuntimeException("Media not found with id: "+audioId));
        post.setMedia(audio);
        postrepository.save(post);

        return new PostResponseDTO(post);
    }

    public PostResponseDTO createPostVideo(PostRequestDTO requestDTO, Long videoId, Long userId) {

        Post post = new Post();
        post.setDescription(requestDTO.getDescription());
        post.setUploadedAt(LocalDateTime.now());
        post.setUser(userRepository.findById(userId).orElseThrow(()->new UserNotFoundException("User not found with id: "+userId)));
        Media video = videoRepository.findById(videoId).orElseThrow(()->new RuntimeException("Video not found with id: "+videoId));
        post.setMedia(video);
        postrepository.save(post);

        return new PostResponseDTO(post);
    }


}
