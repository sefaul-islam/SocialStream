import React, { useRef, useEffect, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import './VideoPlayer.css';
import { useVideoStore, useRoomStore } from '../../../stores/useRoomStore';
import authService from '../../../services/authService';

const VideoPlayer = ({ video, roomId, isHost, videoUrl, thumbnail }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const syncIntervalRef = useRef(null);
  const ignoreEventsRef = useRef(false);
  const viewTrackedRef = useRef(false);
  const watchStartTimeRef = useRef(null);

  // Zustand stores (only used in room context)
  const { setPlayerRef, updatePosition, setIsPlaying } = useVideoStore();
  const { sendPlay, sendPause, sendSeek, sendSync } = useRoomStore();
  
  // Check if we're in a room context or standalone mode
  const isRoomContext = roomId !== undefined && isHost !== undefined;

  // Determine video source with fallback options
  // Backend returns camelCase (mediaUrl), but some legacy code uses lowercase (mediaurl)
  const videoSource = videoUrl || video?.mediaUrl || video?.mediaurl || video?.url || video?.videoUrl || video?.videoPath;
  const posterImage = thumbnail || video?.thumbnailUrl || video?.thumbnailurl || video?.thumbnail || video?.posterUrl;
  
  // Determine video type
  const getVideoType = (src) => {
    if (!src) return 'video/mp4';
    if (src.includes('.m3u8')) return 'application/x-mpegURL';
    if (src.includes('.mp4')) return 'video/mp4';
    if (src.includes('.webm')) return 'video/webm';
    return 'video/mp4'; // Default fallback
  };

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      const videoElement = videoRef.current;

      try {
        const player = playerRef.current = videojs(videoElement, {
          controls: isRoomContext ? isHost : true, // In room: only host controls. Standalone: always show controls
          autoplay: false,
          preload: 'auto',
          fluid: true,
          responsive: true,
          poster: posterImage,
          controlBar: {
            pictureInPictureToggle: false,
          },
          html5: {
            vhs: {
              overrideNative: true
            },
            nativeVideoTracks: false,
            nativeAudioTracks: false,
            nativeTextTracks: false
          },
          sources: videoSource ? [{
            src: videoSource,
            type: getVideoType(videoSource)
          }] : []
        });
        
        // Add error handler
        player.on('error', function() {
          const error = player.error();
          console.error('Video.js Error:', error);
          
          if (error && error.code === 4) {
            console.error('Media source not supported. Video URL:', videoSource);
            console.error('Attempting to use native video element...');
            
            // Fallback: try loading with native video element
            if (videoSource) {
              player.src({
                src: videoSource,
                type: 'video/mp4'
              });
            }
          }
        });

        player.ready(() => {
          console.log('Video.js player is ready');
          setIsReady(true);
          
          // Set player reference in Zustand store (only in room context)
          if (isRoomContext) {
            setPlayerRef(player);
          }
          
          // Track view after 18 seconds of watching
          player.on('play', () => {
            if (!watchStartTimeRef.current) {
              watchStartTimeRef.current = Date.now();
            }
          });
          
          player.on('timeupdate', () => {
            if (!viewTrackedRef.current && watchStartTimeRef.current) {
              const watchDuration = Math.floor((Date.now() - watchStartTimeRef.current) / 1000);
              
              if (watchDuration >= 18 && video?.id) {
                // Record view
                recordVideoView(video.id, watchDuration);
                viewTrackedRef.current = true;
              }
            }
          });
          
          // Add custom skip buttons to the control bar (only for host in room context)
          if (isRoomContext && isHost) {
            const Button = videojs.getComponent('Button');
            
            // Skip Backward Button
            class SkipBackwardButton extends Button {
              constructor(player, options) {
                super(player, options);
                this.controlText('Skip Backward 5s');
              }
              
              handleClick() {
                const currentTime = this.player().currentTime();
                const newTime = Math.max(0, currentTime - 5);
                this.player().currentTime(newTime);
                // Send seek event
                if (roomId) {
                  sendSeek(roomId, newTime);
                }
              }
              
              buildCSSClass() {
                return 'vjs-skip-backward-5 vjs-control vjs-button';
              }
            }
            
            // Skip Forward Button
            class SkipForwardButton extends Button {
              constructor(player, options) {
                super(player, options);
                this.controlText('Skip Forward 5s');
              }
              
              handleClick() {
                const currentTime = this.player().currentTime();
                const duration = this.player().duration();
                const newTime = Math.min(duration || currentTime + 5, currentTime + 5);
                this.player().currentTime(newTime);
                // Send seek event
                if (roomId) {
                  sendSeek(roomId, newTime);
                }
              }
              
              buildCSSClass() {
                return 'vjs-skip-forward-5 vjs-control vjs-button';
              }
            }

            videojs.registerComponent('SkipBackwardButton', SkipBackwardButton);
            videojs.registerComponent('SkipForwardButton', SkipForwardButton);

            // Add buttons to control bar
            player.getChild('controlBar').addChild('SkipBackwardButton', {}, 0);
            player.getChild('controlBar').addChild('SkipForwardButton', {}, 1);
          }
        });

        // Host event listeners - send WebSocket events
        if (isHost && roomId) {
          player.on('play', () => {
            if (!ignoreEventsRef.current) {
              const position = player.currentTime();
              sendPlay(roomId, position);
              setIsPlaying(true);
            }
          });

          player.on('pause', () => {
            if (!ignoreEventsRef.current) {
              const position = player.currentTime();
              sendPause(roomId, position);
              setIsPlaying(false);
            }
          });

          player.on('seeked', () => {
            if (!ignoreEventsRef.current) {
              const position = player.currentTime();
              sendSeek(roomId, position);
              updatePosition(position);
            }
          });

          // Update position periodically
          player.on('timeupdate', () => {
            const position = player.currentTime();
            updatePosition(position);
          });

          // Set up keyboard shortcuts (only for host)
          player.on('keydown', function(event) {
            // Arrow Left: Skip backward 5 seconds
            if (event.which === 37) {
              event.preventDefault();
              const currentTime = player.currentTime();
              const newTime = Math.max(0, currentTime - 5);
              player.currentTime(newTime);
              sendSeek(roomId, newTime);
            }
            // Arrow Right: Skip forward 5 seconds
            if (event.which === 39) {
              event.preventDefault();
              const currentTime = player.currentTime();
              const duration = player.duration();
              const newTime = Math.min(duration || currentTime + 5, currentTime + 5);
              player.currentTime(newTime);
              sendSeek(roomId, newTime);
            }
          });

          // Start periodic sync (every 60 seconds)
          syncIntervalRef.current = setInterval(() => {
            const position = player.currentTime();
            sendSync(roomId, position);
          }, 60000);
        } else if (isRoomContext) {
          // Non-host in room: just update local position
          player.on('timeupdate', () => {
            const position = player.currentTime();
            updatePosition(position);
          });
        }
        // Standalone mode (VideoDetailsPage): no event handlers needed
      } catch (error) {
        console.error('Error initializing video player:', error);
      }
    }

    return () => {
      // Clear sync interval
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [posterImage, isHost, roomId]);

  // Update video source when video changes
  useEffect(() => {
    const player = playerRef.current;

    if (player && videoSource && isReady) {
      console.log('Updating video source:', videoSource);
      
      ignoreEventsRef.current = true;
      
      // Detect video type and set source
      const sourceType = getVideoType(videoSource);
      console.log('Detected video type:', sourceType);
      
      player.src({
        src: videoSource,
        type: sourceType
      });
      
      player.load();
      
      // Reset ignore flag after a short delay
      setTimeout(() => {
        ignoreEventsRef.current = false;
      }, 500);
    }
  }, [videoSource, isReady, video]);

  // Function to record video view
  const recordVideoView = async (videoId, watchDuration) => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.log('No auth token, skipping view tracking');
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${API_BASE_URL}/api/videos/${videoId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ watchDuration }),
      });

      if (response.ok) {
        console.log('View recorded successfully');
      }
    } catch (error) {
      console.error('Failed to record view:', error);
    }
  };

  // Dispose the Video.js player when the component unmounts
  useEffect(() => {
    return () => {
      const player = playerRef.current;
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player className="w-full max-w-full mx-auto">
      {!isHost && (
        <div className="mb-2 text-center text-sm text-yellow-400">
          ⚠️ Viewer Mode - Only the host can control playback
        </div>
      )}
      {!videoSource && (
        <div className="mb-2 text-center text-sm text-red-400 bg-red-900/20 p-3 rounded">
          ⚠️ No video source available. The video URL might be missing from the database.
        </div>
      )}
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered"
        playsInline
      >
        {videoSource && <source src={videoSource} type={getVideoType(videoSource)} />}
        <p className="vjs-no-js">
          To view this video please enable JavaScript, and consider upgrading to a
          web browser that supports HTML5 video
        </p>
      </video>
    </div>
  );
};

export default VideoPlayer;
