import React, { useRef, useEffect, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import './VideoPlayer.css';
import { useVideoStore, useRoomStore } from '../../../stores/useRoomStore';
import { motion, AnimatePresence } from 'framer-motion';

const VideoPlayer = ({ video, roomId, isHost, videoUrl, thumbnail }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [showSyncPopup, setShowSyncPopup] = useState(false);
  const [hasUserResponded, setHasUserResponded] = useState(false);
  const syncIntervalRef = useRef(null);
  const ignoreEventsRef = useRef(false);

  // Zustand stores - use selective subscriptions to avoid unnecessary re-renders
  const setPlayerRef = useVideoStore(state => state.setPlayerRef);
  const updatePosition = useVideoStore(state => state.updatePosition);
  const setIsPlaying = useVideoStore(state => state.setIsPlaying);
  const currentVideo = useVideoStore(state => state.currentVideo);
  
  const sendPlay = useRoomStore(state => state.sendPlay);
  const sendPause = useRoomStore(state => state.sendPause);
  const sendSeek = useRoomStore(state => state.sendSeek);
  const sendSync = useRoomStore(state => state.sendSync);
  const roomState = useRoomStore(state => state.roomState);

  // Only log when video ID changes, not on every render
  const videoIdRef = useRef(video?.id);
  useEffect(() => {
    if (videoIdRef.current !== video?.id) {
      videoIdRef.current = video?.id;
      console.log('VideoPlayer video changed:', {
        videoId: video?.id,
        videoTitle: video?.title,
        isHost,
        roomId,
        videoUrl
      });
    }
  }, [video?.id]);

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
  
  // Check if user should see sync popup (non-host joining during playback)
  // Only show if video is playing AND position is greater than 0 seconds
  useEffect(() => {
    const shouldShowPopup = 
      roomId && // Must be in a room
      !isHost && // Must be a viewer
      !hasUserResponded && // Haven't responded yet
      roomState && 
      roomState.isPlaying && 
      roomState.playbackPosition > 0 && // Only show if video has progressed
      isReady;
    
    if (shouldShowPopup) {
      console.log('Showing sync popup - position:', roomState.playbackPosition);
      setShowSyncPopup(true);
      
      // Auto-dismiss after 30 seconds with default action (sync)
      const timeout = setTimeout(() => {
        if (!hasUserResponded) {
          handleSyncAccept();
        }
      }, 30000);
      
      return () => clearTimeout(timeout);
    }
  }, [isHost, hasUserResponded, roomState, isReady, roomId]);
  
  // Handle sync acceptance
  const handleSyncAccept = () => {
    setHasUserResponded(true);
    setShowSyncPopup(false);
    
    const player = playerRef.current;
    if (player && roomState) {
      ignoreEventsRef.current = true;
      
      // Sync to current position
      if (roomState.playbackPosition) {
        player.currentTime(roomState.playbackPosition);
      }
      
      // Sync play state
      if (roomState.isPlaying) {
        player.play().catch(err => console.error('Auto-play failed:', err));
      }
      
      setTimeout(() => {
        ignoreEventsRef.current = false;
      }, 500);
    }
  };
  
  // Handle sync decline
  const handleSyncDecline = () => {
    setHasUserResponded(true);
    setShowSyncPopup(false);
    // User can browse queue or just watch from beginning
  };

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      const videoElement = videoRef.current;

      try {
        console.log('Initializing Video.js with source:', videoSource);
        console.log('isHost:', isHost, 'roomId:', roomId);
        
        const player = playerRef.current = videojs(videoElement, {
          controls: true, // Always show controls so play button appears
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
          console.error('Video.js Error - Code:', error?.code);
          console.error('Error message:', error?.message);
          console.error('Video URL attempted:', videoSource);
          
          if (error && error.code === 4) {
            console.error('Media source not supported. Video URL:', videoSource);
            console.error('Attempting to use native video element with mp4 fallback...');
            
            // Fallback: try loading with native video element as mp4
            if (videoSource) {
              player.src({
                src: videoSource,
                type: 'video/mp4'
              });
            }
          }
        });
        
        // Add loadstart listener to track when video starts loading
        player.on('loadstart', function() {
          console.log('Video loading started:', videoSource);
        });
        
        // Add canplay listener to confirm video is playable
        player.on('canplay', function() {
          console.log('Video is ready to play - Duration:', player.duration());
        });
        
        // Add loadedmetadata to confirm video metadata is loaded
        player.on('loadedmetadata', function() {
          console.log('Video metadata loaded - Duration:', player.duration());
        });

        player.ready(() => {
          console.log('Video.js player is ready');
          console.log('Room context - isHost:', isHost, 'roomId:', roomId);
          console.log('Video source:', videoSource);
          setIsReady(true);
          
          // Set player reference in Zustand store
          setPlayerRef(player);
          
          // Add custom skip buttons to the control bar (only for host)
          if (isHost) {
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

            // Add buttons to control bar if it exists
            const controlBar = player.getChild('controlBar');
            if (controlBar) {
              controlBar.addChild('SkipBackwardButton', {}, 0);
              controlBar.addChild('SkipForwardButton', {}, 1);
            } else {
              console.warn('Control bar not found, skipping custom buttons');
            }
          }
        });

        // Store player ref for later use
        setPlayerRef(player);
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing video player:', error);
      }
    }
  }, [posterImage]); // Only re-initialize if poster changes

  // Separate useEffect for event listeners - runs when isHost or roomId changes
  useEffect(() => {
    const player = playerRef.current;
    
    if (!player || !isReady) {
      return;
    }

    console.log('🎯 Setting up event listeners - isHost:', isHost, 'roomId:', roomId);

    // Host event listeners - send WebSocket events
    if (isHost && roomId) {
      const handlePlay = () => {
        if (!ignoreEventsRef.current) {
          const position = player.currentTime();
          console.log('[Host] Broadcasting PLAY at position:', position);
          sendPlay(roomId, position);
        }
      };

      const handlePause = () => {
        if (!ignoreEventsRef.current) {
          const position = player.currentTime();
          console.log('[Host] Broadcasting PAUSE at position:', position);
          sendPause(roomId, position);
        }
      };

      const handleSeeked = () => {
        if (!ignoreEventsRef.current) {
          const position = player.currentTime();
          console.log('[Host] Broadcasting SEEK to position:', position);
          sendSeek(roomId, position);
          updatePosition(position);
        }
      };

      const handleTimeUpdate = () => {
        const position = player.currentTime();
        updatePosition(position);
      };

      const handleKeyDown = (event) => {
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
      };

      player.on('play', handlePlay);
      player.on('pause', handlePause);
      player.on('seeked', handleSeeked);
      player.on('timeupdate', handleTimeUpdate);
      player.on('keydown', handleKeyDown);

      // Start periodic sync (every 30 seconds)
      syncIntervalRef.current = setInterval(() => {
        const position = player.currentTime();
        console.log('[Host] Broadcasting SYNC at position:', position);
        sendSync(roomId, position);
      }, 30000);

      console.log('✅ Host event listeners registered');

      // Cleanup function for this useEffect
      return () => {
        player.off('play', handlePlay);
        player.off('pause', handlePause);
        player.off('seeked', handleSeeked);
        player.off('timeupdate', handleTimeUpdate);
        player.off('keydown', handleKeyDown);
        
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
        
        console.log('🧹 Host event listeners removed');
      };
    } else if (roomId) {
      // Viewers in room: listen to video events for debugging
      console.log('[Viewer] Setting up event listeners');
      
      const handlePlay = () => {
        console.log('[Viewer] Local play event triggered');
      };
      
      const handlePause = () => {
        console.log('[Viewer] Local pause event triggered');
      };
      
      const handleTimeUpdate = () => {
        const position = player.currentTime();
        updatePosition(position);
      };

      player.on('play', handlePlay);
      player.on('pause', handlePause);
      player.on('timeupdate', handleTimeUpdate);

      console.log('✅ Viewer event listeners registered');

      return () => {
        player.off('play', handlePlay);
        player.off('pause', handlePause);
        player.off('timeupdate', handleTimeUpdate);
        console.log('🧹 Viewer event listeners removed');
      };
    } else {
      // Solo mode: just update local position
      console.log('[Solo] Setting up timeupdate listener');
      
      const handleTimeUpdate = () => {
        const position = player.currentTime();
        updatePosition(position);
      };

      player.on('timeupdate', handleTimeUpdate);

      return () => {
        player.off('timeupdate', handleTimeUpdate);
      };
    }
  }, [isHost, roomId, isReady]); // Re-run when role or room changes

  // Update video source when video changes
  useEffect(() => {
    const player = playerRef.current;

    if (player && videoSource && isReady) {
      console.log('Updating video source:', videoSource);
      console.log('Video object:', video);
      
      ignoreEventsRef.current = true;
      
      // Detect video type and set source
      const sourceType = getVideoType(videoSource);
      console.log('Detected video type:', sourceType);
      console.log('Setting video source:', videoSource);
      
      player.src({
        src: videoSource,
        type: sourceType
      });
      
      player.load();
      
      // Reset ignore flag after a delay
      setTimeout(() => {
        ignoreEventsRef.current = false;
      }, 1000);
    }
  }, [videoSource, isReady, video]);

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
    <div data-vjs-player className="w-full max-w-full mx-auto relative">
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
      
      {/* Sync Popup */}
      <AnimatePresence>
        {showSyncPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-green-500/30 max-w-md mx-4 shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Video in Progress</h3>
                <p className="text-gray-300 mb-1">
                  {video?.title || 'A video'} is currently playing
                </p>
                <p className="text-sm text-gray-400">
                  at {Math.floor((roomState?.playbackPosition || 0) / 60)}:{String(Math.floor((roomState?.playbackPosition || 0) % 60)).padStart(2, '0')}
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handleSyncAccept}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-green-500/50 transform hover:scale-[1.02]"
                >
                  Join Playback
                </button>
                
                <button
                  onClick={handleSyncDecline}
                  className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200"
                >
                  Browse Queue
                </button>
              </div>
              
              <p className="text-xs text-gray-500 text-center mt-4">
                Auto-syncing in 30 seconds...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
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
