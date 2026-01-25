import { create } from 'zustand';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const useRoomStore = create((set, get) => ({
  // Room state
  currentRoom: null,
  roomMembers: [],
  queue: [],
  roomState: null,
  isConnected: false,
  onQueueUpdate: null,
  currentUserId: null,
  
  // WebSocket client
  stompClient: null,

  // Set current room
  setCurrentRoom: (room) => set({ currentRoom: room }),

  // Set room members
  setRoomMembers: (members) => set({ roomMembers: members }),

  // Set queue
  setQueue: (queue) => set({ queue: queue }),

  // Set room state
  setRoomState: (state) => set({ roomState: state }),

  // Set queue update callback
  setOnQueueUpdate: (callback) => set({ onQueueUpdate: callback }),
  
  // Set current user ID
  setCurrentUserId: (userId) => set({ currentUserId: userId }),

  // Connect to WebSocket
  connectWebSocket: (roomId, token) => {
    const socket = new SockJS(`${API_BASE_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: () => {}, // Disable debug logging
      reconnectDelay: 5000,
      heartbeatIncoming: 10000, // Increased from 4s to 10s
      heartbeatOutgoing: 10000, // Increased from 4s to 10s
    });

    client.onConnect = () => {
      console.log('WebSocket connected to room:', roomId);
      set({ isConnected: true });

      // Subscribe to room topic
      client.subscribe(`/topic/room/${roomId}`, (message) => {
        const data = JSON.parse(message.body);
        
        // Ignore messages sent by current user to prevent infinite loops
        const { currentUserId } = get();
        if (data.senderId && currentUserId && data.senderId === currentUserId) {
          console.log('Ignoring own message:', data.action);
          return;
        }
        
        // Update video store based on action
        const videoStore = useVideoStore.getState();
        
        switch (data.action) {
          case 'PLAY':
            videoStore.handlePlayEvent(data.position, data.videoId);
            break;
          case 'PAUSE':
            videoStore.handlePauseEvent(data.position, data.videoId);
            break;
          case 'SEEK':
            videoStore.handleSeekEvent(data.position);
            break;
          case 'CHANGE_VIDEO':
            videoStore.handleChangeVideoEvent(data.videoId);
            break;
          case 'SYNC':
            videoStore.handleSyncEvent(data.position, data.videoId);
            break;
          case 'QUEUE_UPDATED':
            // Trigger queue refresh callback if set
            const { onQueueUpdate } = get();
            if (onQueueUpdate) {
              onQueueUpdate();
            }
            break;
          default:
            console.warn('Unknown action:', data.action);
        }
      });
    };

    client.onStompError = (frame) => {
      console.error('STOMP error:', frame);
      set({ isConnected: false });
    };

    client.activate();
    set({ stompClient: client });
  },

  // Disconnect from WebSocket
  disconnectWebSocket: () => {
    const { stompClient } = get();
    if (stompClient) {
      stompClient.deactivate();
      set({ stompClient: null, isConnected: false });
    }
  },

  // Send play command (Host only)
  sendPlay: (roomId, position) => {
    const { stompClient } = get();
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: `/app/room/${roomId}/play`,
        body: JSON.stringify({ position }),
      });
    }
  },

  // Send pause command (Host only)
  sendPause: (roomId, position) => {
    const { stompClient } = get();
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: `/app/room/${roomId}/pause`,
        body: JSON.stringify({ position }),
      });
    }
  },

  // Send seek command (Host only)
  sendSeek: (roomId, position) => {
    const { stompClient } = get();
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: `/app/room/${roomId}/seek`,
        body: JSON.stringify({ position }),
      });
    }
  },

  // Send change video command (Host only)
  sendChangeVideo: (roomId, videoId) => {
    const { stompClient } = get();
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: `/app/room/${roomId}/changeVideo`,
        body: JSON.stringify({ videoId }),
      });
    }
  },

  // Send sync command (Host only, periodic)
  sendSync: (roomId, position) => {
    const { stompClient } = get();
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: `/app/room/${roomId}/sync`,
        body: JSON.stringify({ position }),
      });
    }
  },

  // Clear room data
  clearRoom: () => {
    const { disconnectWebSocket } = get();
    disconnectWebSocket();
    set({
      currentRoom: null,
      roomMembers: [],
      queue: [],
      roomState: null,
    });
  },
}));

// Separate video store import to avoid circular dependency
const useVideoStore = create((set, get) => ({
  // Video state
  currentVideo: null,
  playbackPosition: 0,
  isPlaying: false,
  lastSyncTime: null,
  
  // Player reference (will be set by VideoPlayer component)
  playerRef: null,

  // Set player reference
  setPlayerRef: (ref) => set({ playerRef: ref }),

  // Handle play event from WebSocket
  handlePlayEvent: (position, videoId) => {
    const { playerRef, currentVideo } = get();
    if (playerRef && currentVideo?.id === videoId) {
      playerRef.currentTime(position);
      playerRef.play();
      set({ isPlaying: true, playbackPosition: position, lastSyncTime: Date.now() });
    }
  },

  // Handle pause event from WebSocket
  handlePauseEvent: (position, videoId) => {
    const { playerRef, currentVideo } = get();
    if (playerRef && currentVideo?.id === videoId) {
      playerRef.currentTime(position);
      playerRef.pause();
      set({ isPlaying: false, playbackPosition: position, lastSyncTime: Date.now() });
    }
  },

  // Handle seek event from WebSocket
  handleSeekEvent: (position) => {
    const { playerRef } = get();
    if (playerRef) {
      playerRef.currentTime(position);
      set({ playbackPosition: position, lastSyncTime: Date.now() });
    }
  },

  // Handle change video event from WebSocket
  handleChangeVideoEvent: async (videoId) => {
    // Fetch the video details so viewers can play it
    try {
      // Dynamic import to avoid circular dependency
      const videoService = (await import('../services/videoService.js')).default;
      const video = await videoService.getVideoById(videoId);
      
      console.log('Video changed - Full video object:', video);
      console.log('Video properties check:');
      console.log('  - mediaUrl:', video?.mediaUrl);
      console.log('  - mediaurl:', video?.mediaurl);
      console.log('  - url:', video?.url);
      console.log('  - videoUrl:', video?.videoUrl);
      console.log('  - thumbnailUrl:', video?.thumbnailUrl);
      console.log('  - thumbnailurl:', video?.thumbnailurl);
      
      set({ 
        currentVideo: video,
        playbackPosition: 0, 
        isPlaying: false,
        lastSyncTime: Date.now() 
      });
      
      console.log('Video changed to:', video?.title);
    } catch (error) {
      console.error('Failed to fetch video for playback:', error);
      console.error('Error details:', error.message);
    }
  },

  // Handle sync event from WebSocket (drift correction)
  handleSyncEvent: (position, videoId) => {
    const { playerRef, currentVideo, playbackPosition } = get();
    if (playerRef && currentVideo?.id === videoId) {
      const currentTime = playerRef.currentTime();
      const drift = Math.abs(currentTime - position);
      
      // Only correct if drift is greater than 2 seconds
      if (drift > 2) {
        console.log(`Correcting drift: ${drift.toFixed(2)}s`);
        playerRef.currentTime(position);
      }
      
      set({ playbackPosition: position, lastSyncTime: Date.now() });
    }
  },

  // Set current video
  setCurrentVideo: (video) => set({ currentVideo: video }),

  // Update playback position (called by player)
  updatePosition: (position) => set({ playbackPosition: position }),

  // Update playing state
  setIsPlaying: (isPlaying) => set({ isPlaying }),

  // Clear video state
  clearVideo: () => set({
    currentVideo: null,
    playbackPosition: 0,
    isPlaying: false,
    lastSyncTime: null,
  }),
}));

export { useRoomStore, useVideoStore };
