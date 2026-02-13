import { create } from 'zustand';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import authService from '../services/authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const useMessageStore = create((set, get) => ({
  // Connection state
  client: null,
  isConnected: false,
  currentUserId: null,

  // Messages state - Map<conversationId, Array<message>>
  // conversationId is the friend's userId
  conversations: new Map(),
  
  // Typing indicators - Map<userId, {isTyping: boolean, senderName: string}>
  typingIndicators: new Map(),

  // Unread messages - Map<conversationId, number>
  unreadConversations: new Map(),

  // Message queue for offline messages
  pendingMessages: [],

  // Set current user ID
  setCurrentUserId: (userId) => set({ currentUserId: userId }),

  // Add message to conversation
  addMessage: (message) => set((state) => {
    const conversations = new Map(state.conversations);
    const unreadConversations = new Map(state.unreadConversations);
    const senderId = message.senderId;
    const recipientId = message.recipientId;
    const currentUserId = state.currentUserId;
    
    // Determine the conversation partner
    const conversationId = senderId === currentUserId ? recipientId : senderId;
    
    // Get or create conversation array
    const conversationMessages = conversations.get(conversationId) || [];
    
    // Check if message already exists (avoid duplicates)
    const exists = conversationMessages.some(m => m.id === message.id);
    if (!exists) {
      conversationMessages.push(message);
      // Sort by timestamp (newest last for chat display)
      conversationMessages.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      conversations.set(conversationId, conversationMessages);
      
      // Increment unread count if message is from another user
      if (senderId !== currentUserId) {
        const currentUnread = unreadConversations.get(conversationId) || 0;
        unreadConversations.set(conversationId, currentUnread + 1);
      }
    }
    
    return { conversations, unreadConversations };
  }),

  // Update message (for reactions)
  updateMessage: (messageId, updatedMessage) => set((state) => {
    const conversations = new Map(state.conversations);
    
    // Find and update the message in any conversation
    for (const [conversationId, messages] of conversations.entries()) {
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        const updatedMessages = [...messages];
        updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], ...updatedMessage };
        conversations.set(conversationId, updatedMessages);
        break;
      }
    }
    
    return { conversations };
  }),

  // Set conversation messages (when loading from API)
  setConversationMessages: (friendId, messages) => set((state) => {
    const conversations = new Map(state.conversations);
    // Messages from API come in DESC order (newest first), reverse for display
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    conversations.set(friendId, sortedMessages);
    return { conversations };
  }),

  // Prepend older messages (for pagination)
  prependMessages: (friendId, olderMessages) => set((state) => {
    const conversations = new Map(state.conversations);
    const existing = conversations.get(friendId) || [];
    
    // Filter out any duplicates
    const newMessages = olderMessages.filter(
      oldMsg => !existing.some(existingMsg => existingMsg.id === oldMsg.id)
    );
    
    // Sort and prepend
    const combined = [...newMessages, ...existing].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    conversations.set(friendId, combined);
    return { conversations };
  }),

  // Set typing indicator
  setTypingIndicator: (userId, isTyping, senderName) => set((state) => {
    const typingIndicators = new Map(state.typingIndicators);
    
    if (isTyping) {
      typingIndicators.set(userId, { isTyping: true, senderName });
    } else {
      typingIndicators.delete(userId);
    }
    
    return { typingIndicators };
  }),

  // Clear typing indicator
  clearTypingIndicator: (userId) => set((state) => {
    const typingIndicators = new Map(state.typingIndicators);
    typingIndicators.delete(userId);
    return { typingIndicators };
  }),

  // Mark conversation as read
  markConversationAsRead: (conversationId) => set((state) => {
    const unreadConversations = new Map(state.unreadConversations);
    unreadConversations.delete(conversationId);
    return { unreadConversations };
  }),

  // Get total unread count
  getTotalUnreadCount: () => {
    const { unreadConversations } = get();
    let total = 0;
    for (const count of unreadConversations.values()) {
      total += count;
    }
    return total;
  },

  // Connect to WebSocket
  connectWebSocket: (userId, token = null) => {
    const { client: existingClient } = get();
    
    // Don't reconnect if already connected
    if (existingClient && existingClient.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const authToken = token || authService.getToken();
    if (!authToken) {
      console.error('No authentication token available');
      return;
    }

    const socket = new SockJS(`${API_BASE_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${authToken}`,
      },
      debug: (str) => {
        // console.log('[WebSocket Debug]', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.onConnect = () => {
      console.log('✅ Messaging WebSocket connected for user:', userId);
      set({ isConnected: true, currentUserId: userId });

      // Subscribe to personal message queue
      client.subscribe(`/queue/${userId}/messages`, (message) => {
        try {
          const messageData = JSON.parse(message.body);
          console.log('📨 Received new message:', messageData);
          
          // Add to store
          get().addMessage(messageData);
          
          // Play notification sound
          get().playNotificationSound();
          
          // Show browser notification if permission granted
          get().showBrowserNotification(messageData);
          
        } catch (error) {
          console.error('Error processing incoming message:', error);
        }
      });

      // Subscribe to message sent confirmations
      client.subscribe(`/queue/${userId}/sent`, (message) => {
        try {
          const messageData = JSON.parse(message.body);
          console.log('✅ Message sent confirmation:', messageData);
          
          // Add to store (in case it's not already there)
          get().addMessage(messageData);
          
        } catch (error) {
          console.error('Error processing sent confirmation:', error);
        }
      });

      // Subscribe to typing indicators
      client.subscribe(`/queue/${userId}/typing`, (message) => {
        try {
          const typingData = JSON.parse(message.body);
          console.log('✏️ Typing indicator:', typingData);
          
          const { senderId, senderName, typing } = typingData;
          get().setTypingIndicator(senderId, typing, senderName);
          
          // Clear typing indicator after 5 seconds
          if (typing) {
            setTimeout(() => {
              get().clearTypingIndicator(senderId);
            }, 5000);
          }
          
        } catch (error) {
          console.error('Error processing typing indicator:', error);
        }
      });

      // Subscribe to reaction updates
      client.subscribe(`/queue/${userId}/reaction`, (message) => {
        try {
          const messageData = JSON.parse(message.body);
          console.log('\u2764\uFE0F Reaction update received:', messageData);
          get().updateMessage(messageData.id, messageData);
          get().playReactionSound();
        } catch (error) {
          console.error('Error processing reaction update:', error);
        }
      });

      // Subscribe to errors
      client.subscribe(`/queue/${userId}/errors`, (message) => {
        try {
          const errorData = JSON.parse(message.body);
          console.error('❌ WebSocket error:', errorData);
          
          // You could show a toast notification here
          
        } catch (error) {
          console.error('Error processing error message:', error);
        }
      });

      // Send any pending messages
      const { pendingMessages } = get();
      if (pendingMessages.length > 0) {
        pendingMessages.forEach(msg => {
          get().sendMessage(msg.recipientId, msg.content);
        });
        set({ pendingMessages: [] });
      }
    };

    client.onStompError = (frame) => {
      console.error('❌ STOMP error:', frame);
      set({ isConnected: false });
    };

    client.onWebSocketClose = () => {
      console.log('🔌 WebSocket connection closed');
      set({ isConnected: false });
    };

    client.activate();
    set({ client, currentUserId: userId });
  },

  // Disconnect from WebSocket
  disconnectWebSocket: () => {
    const { client } = get();
    if (client) {
      console.log('🔌 Disconnecting messaging WebSocket');
      client.deactivate();
      set({ 
        client: null, 
        isConnected: false,
        typingIndicators: new Map()
      });
    }
  },

  // Send message via WebSocket
  sendMessage: (recipientId, content) => {
    const { client, isConnected, currentUserId } = get();
    
    if (!client || !client.connected || !isConnected) {
      console.warn('WebSocket not connected, queuing message');
      set((state) => ({
        pendingMessages: [...state.pendingMessages, { recipientId, content }]
      }));
      return false;
    }

    try {
      client.publish({
        destination: '/app/dm/send',
        body: JSON.stringify({
          recipientId,
          content: content.trim()
        }),
      });
      console.log('📤 Sent message to:', recipientId);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  },

  // Send typing indicator
  sendTypingIndicator: (recipientId, isTyping) => {
    const { client, isConnected } = get();
    
    if (!client || !client.connected || !isConnected) {
      return;
    }

    try {
      client.publish({
        destination: '/app/dm/typing',
        body: JSON.stringify({
          recipientId,
          isTyping
        }),
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  },
  sendReaction: (recipientId, messageId, reactionType) => {
      const { client, isConnected } = get();
      if (!client || !client.connected || !isConnected) {
        return false;
      }
      try {
        client.publish({
          destination: '/app/dm/reaction',
          body: JSON.stringify({
            recipientId,
            messageId,
            reaction: reactionType
          })
        });
        return true;
      } catch (error) {
        console.error('Error sending reaction:', error);
        return false;
      }
  },

  // Play pop sound for reactions
  playReactionSound: () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const t = ctx.currentTime;

      // Short click — tiny noise burst
      const bufferSize = Math.floor(ctx.sampleRate * 0.015);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 2000;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(t);
      source.stop(t + 0.015);
    } catch (error) {
      console.error('Error playing reaction sound:', error);
    }
  },

  // Play notification sound
  playNotificationSound: () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(600, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  },

  // Show browser notification
  showBrowserNotification: (message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`New message from ${message.senderName}`, {
          body: message.message?.substring(0, 100) || 'New message',
          icon: '/logo.png',
          badge: '/logo.png',
          tag: `message-${message.id}`,
        });
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
  },

  // Request notification permission
  requestNotificationPermission: async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }
    return Notification.permission === 'granted';
  },

  // Clear all data (for logout)
  clearAllData: () => set({
    conversations: new Map(),
    typingIndicators: new Map(),
    unreadConversations: new Map(),
    pendingMessages: [],
    currentUserId: null,
  }),
}));

export default useMessageStore;
