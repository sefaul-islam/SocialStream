import { create } from 'zustand';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const useRoomStore = create((set, get) => ({
  // Room state
  currentRoom: null,
  roomMembers: [],
  onlineMembers: [], // Array of user IDs who are currently online
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

  // Set online members
  setOnlineMembers: (memberIds) => set({ onlineMembers: memberIds }),
  
  // Add online member
  addOnlineMember: (userId) => set((state) => {
    if (!state.onlineMembers.includes(userId)) {
      return { onlineMembers: [...state.onlineMembers, userId] };
    }
    return state;
  }),
  
  // Remove online member
  removeOnlineMember: (userId) => set((state) => ({
    onlineMembers: state.onlineMembers.filter(id => id !== userId)
  })),

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
      
      // Broadcast that this user joined the room
      const { currentUserId } = get();
      if (currentUserId) {
        client.publish({
          destination: `/app/room/${roomId}/join`,
          body: JSON.stringify({ userId: currentUserId }),
        });
        playPing();
        console.log('📢 Broadcasted join event for userId:', currentUserId);
      }

      function playPing(){
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if(!AudioContext) return;
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // 1. Set the sound type
        oscillator.type = "sine"; // "sine" is smooth, "square" is 8-bit, "triangle" is sharp
        oscillator.frequency.setValueAtTime(800, ctx.currentTime); // Start at 800Hz (High pitch)
        oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1); // Drop to 300Hz quickly

        // 2. Set the volume (envelope) to fade out
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime); 
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        // 3. Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // 4. Play and Stop
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.5);
        console.log("Pinged");
      }
      // Subscribe to room topic
      client.subscribe(`/topic/room/${roomId}`, (message) => {
        const data = JSON.parse(message.body);
        console.log('[WebSocket] Received message:', data);
        
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
            console.log('[Viewer] Received PLAY event at position:', data.position);
            videoStore.handlePlayEvent(data.position, data.videoId);
            break;
          case 'PAUSE':
            console.log('[Viewer] Received PAUSE event at position:', data.position);
            videoStore.handlePauseEvent(data.position, data.videoId);
            break;
          case 'SEEK':
            console.log('[Viewer] Received SEEK event to position:', data.position);
            videoStore.handleSeekEvent(data.position);
            break;
          case 'CHANGE_VIDEO':
            console.log('[Viewer] Received CHANGE_VIDEO event for videoId:', data.videoId);
            videoStore.handleChangeVideoEvent(data.videoId);
            break;
          case 'SYNC':
            console.log('[Viewer] Received SYNC event at position:', data.position);
            videoStore.handleSyncEvent(data.position, data.videoId);
            break;
          case 'QUEUE_UPDATED':
            // Trigger queue refresh callback if set (legacy behavior)
            const { onQueueUpdate } = get();
            if (onQueueUpdate) {
              onQueueUpdate();
            }
            break;
          case 'VOTE_UPDATED':
            // Real-time queue update with full data - no refetch needed!
            if (data.queue) {
              set({ queue: data.queue });
              console.log('Queue updated in real-time with votes:', data.queue);
            } else {
              // Fallback to callback if queue data not included
              const { onQueueUpdate } = get();
              if (onQueueUpdate) {
                onQueueUpdate();
              }
            }
            break;
          case 'MEMBER_JOINED':
            console.log('👋 Member joined:', data.username, 'userId:', data.userId);
            get().addOnlineMember(data.userId);
            break;
          case 'MEMBER_LEFT':
            console.log('👋 Member left:', data.username, 'userId:', data.userId);
            get().removeOnlineMember(data.userId);
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
    const { stompClient, currentUserId, currentRoom } = get();
    if (stompClient && stompClient.connected && currentUserId && currentRoom) {
      // Broadcast that this user is leaving
      try {
        stompClient.publish({
          destination: `/app/room/${currentRoom.id}/leave`,
          body: JSON.stringify({ userId: currentUserId }),
        });
        console.log('📢 Broadcasted leave event for userId:', currentUserId);
      } catch (error) {
        console.error('Error sending leave broadcast:', error);
      }
    }
    
    if (stompClient) {
      stompClient.deactivate();
      set({ stompClient: null, isConnected: false, onlineMembers: [] });
    }
  },

  // Send play command (Host only)
  sendPlay: (roomId, position) => {
    const { stompClient, isConnected } = get();
    console.log('[sendPlay] Called - roomId:', roomId, 'position:', position, 'connected:', isConnected);
    
    if (stompClient && stompClient.connected) {
      console.log('[sendPlay] Publishing to /app/room/' + roomId + '/play');
      stompClient.publish({
        destination: `/app/room/${roomId}/play`,
        body: JSON.stringify({ position }),
      });
    } else {
      console.error('[sendPlay] Cannot send - WebSocket not connected');
    }
  },

  // Send pause command (Host only)
  sendPause: (roomId, position) => {
    const { stompClient, isConnected } = get();
    console.log('[sendPause] Called - roomId:', roomId, 'position:', position, 'connected:', isConnected);
    
    if (stompClient && stompClient.connected) {
      console.log('[sendPause] Publishing to /app/room/' + roomId + '/pause');
      stompClient.publish({
        destination: `/app/room/${roomId}/pause`,
        body: JSON.stringify({ position }),
      });
    } else {
      console.error('[sendPause] Cannot send - WebSocket not connected');
    }
  },

  // Send seek command (Host only)
  sendSeek: (roomId, position) => {
    const { stompClient, isConnected } = get();
    console.log('[sendSeek] Called - roomId:', roomId, 'position:', position, 'connected:', isConnected);
    
    if (stompClient && stompClient.connected) {
      console.log('[sendSeek] Publishing to /app/room/' + roomId + '/seek');
      stompClient.publish({
        destination: `/app/room/${roomId}/seek`,
        body: JSON.stringify({ position }),
      });
    } else {
      console.error('[sendSeek] Cannot send - WebSocket not connected');
    }
  },

  // Send change video command (Host only)
  sendChangeVideo: (roomId, videoId) => {
    const { stompClient, isConnected } = get();
    console.log('[sendChangeVideo] Called - roomId:', roomId, 'videoId:', videoId, 'connected:', isConnected);
    
    if (stompClient && stompClient.connected) {
      console.log('[sendChangeVideo] Publishing to /app/room/' + roomId + '/changeVideo');
      stompClient.publish({
        destination: `/app/room/${roomId}/changeVideo`,
        body: JSON.stringify({ videoId }),
      });
    } else {
      console.error('[sendChangeVideo] Cannot send - WebSocket not connected');
    }
  },

  // Send sync command (Host only, periodic)
  sendSync: (roomId, position) => {
    const { stompClient, isConnected } = get();
    console.log('[sendSync] Called - roomId:', roomId, 'position:', position, 'connected:', isConnected);
    
    if (stompClient && stompClient.connected) {
      console.log('[sendSync] Publishing to /app/room/' + roomId + '/sync');
      stompClient.publish({
        destination: `/app/room/${roomId}/sync`,
        body: JSON.stringify({ position }),
      });
    } else {
      console.error('[sendSync] Cannot send - WebSocket not connected');
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
    console.log('handlePlayEvent - playerRef exists:', !!playerRef, 'currentVideo id:', currentVideo?.id, 'expected videoId:', videoId);
    if (playerRef && currentVideo?.id === videoId) {
      console.log('Playing video from position:', position);
      playerRef.currentTime(position);
      const playPromise = playerRef.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => console.error('Play failed:', err));
      }
      set({ isPlaying: true, playbackPosition: position, lastSyncTime: Date.now() });
    }
  },

  // Handle pause event from WebSocket
  handlePauseEvent: (position, videoId) => {
    const { playerRef, currentVideo } = get();
    console.log('handlePauseEvent - playerRef exists:', !!playerRef, 'currentVideo id:', currentVideo?.id, 'expected videoId:', videoId);
    if (playerRef && currentVideo?.id === videoId) {
      console.log('Pausing video at position:', position);
      playerRef.currentTime(position);
      playerRef.pause();
      set({ isPlaying: false, playbackPosition: position, lastSyncTime: Date.now() });
    }
  },

  // Handle seek event from WebSocket
  handleSeekEvent: (position) => {
    const { playerRef } = get();
    console.log('handleSeekEvent - seeking to:', position, 'playerRef exists:', !!playerRef);
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
