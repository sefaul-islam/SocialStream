package com.example.SocialStream.controllers;

import com.example.SocialStream.DTO.AudioResponseDTO;
import com.example.SocialStream.DTO.PostRequestDTO;
import com.example.SocialStream.DTO.PostResponseDTO;
import com.example.SocialStream.DTO.VideoResponseDTO;
import com.example.SocialStream.entities.Audio;
import com.example.SocialStream.entities.Video;
import com.example.SocialStream.repositories.AudioRepository;
import com.example.SocialStream.repositories.VideoRepository;
import com.example.SocialStream.services.NewsFeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/newsfeed")
public class NewsFeedController {

    private final NewsFeedService newsFeedService;
    private final AudioRepository audioRepository;
    private final VideoRepository videoRepository;

    @PostMapping("/createposts")
    public ResponseEntity<PostResponseDTO> createPost(@RequestBody PostRequestDTO requestDTO, @RequestParam Long mediaId,
                                                      @RequestParam Long userId) {

        return ResponseEntity.status(HttpStatus.CREATED).body(newsFeedService.createPostAudio(requestDTO,mediaId,userId));
    }

    @PostMapping("/createvideoposts")
    public ResponseEntity<PostResponseDTO> createVideoPost(@RequestBody PostRequestDTO requestDTO, @RequestParam Long mediaId,
                                                          @RequestParam Long userId) {

        return ResponseEntity.status(HttpStatus.CREATED).body(newsFeedService.createPostVideo(requestDTO,mediaId,userId));
    }

    @GetMapping("getaudiourl")
    public ResponseEntity<AudioResponseDTO> getAudioUrl(@RequestParam String title){
        Audio audio = audioRepository.findByTitle(title).orElseThrow(()->new RuntimeException("Audio not found with title: "+title));
        AudioResponseDTO audioResponseDTO = new AudioResponseDTO(audio);
        return ResponseEntity.status(HttpStatus.OK).body(audioResponseDTO);
    }

    @GetMapping("getvideourl")
    public ResponseEntity<VideoResponseDTO> geVideoUrl(@RequestParam String title){
        Video video = videoRepository.findByTitle(title).orElseThrow(()->new RuntimeException("Audio not found with title: "+title));
        VideoResponseDTO videoResponseDTO = new VideoResponseDTO(video);
        return ResponseEntity.status(HttpStatus.OK).body(videoResponseDTO);
    }
}
