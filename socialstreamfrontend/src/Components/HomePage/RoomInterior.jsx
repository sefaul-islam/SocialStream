import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRoomStore, useVideoStore } from '../../stores/useRoomStore';
import roomService from '../../services/roomService';
import searchService from '../../services/searchService';
import authService from '../../services/authService';
import VideoPlayer from './Video/VideoPlayer';

const RoomInterior = ({ roomId, onLeave }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [userRole, setUserRole] = useState('MEMBER');
  const [userId, setUserId] = useState(null);

  // Chat state
  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      userId: 1,
      username: 'Alice',
      role: 'HOST',
      text: 'Welcome to the room! 🎬',
      timestamp: new Date(Date.now() - 300000), // 5 min ago
      avatar: null
    },
    {
      id: 'msg-2',
      userId: 2,
      username: 'Bob',
      role: 'MEMBER',
      text: 'Thanks for hosting!',
      timestamp: new Date(Date.now() - 180000), // 3 min ago
      avatar: null
    },
    {
      id: 'msg-3',
      userId: 3,
      username: 'Charlie',
      role: 'MEMBER',
      text: 'Great movie choice!',
      timestamp: new Date(Date.now() - 60000), // 1 min ago
      avatar: null
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Zustand stores
  const {
    currentRoom,
    roomMembers,
    onlineMembers,
    queue,
    roomState,
    isConnected,
    setCurrentRoom,
    setQueue,
    setRoomMembers,
    setRoomState,
    setCurrentUserId,
    connectWebSocket,
    disconnectWebSocket,
    sendPlay,
    sendPause,
    sendSeek,
    sendChangeVideo,
    sendSync,
    setOnQueueUpdate,
  } = useRoomStore();

  const {
    currentVideo,
    setCurrentVideo,
  } = useVideoStore();

  const syncIntervalRef = useRef(null);

  // Initialize room and WebSocket connection
  useEffect(() => {
    initializeRoom();
    
    // Register queue update callback
    setOnQueueUpdate(() => fetchQueue);
    
    return () => {
      // Cleanup on unmount
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      setOnQueueUpdate(null);
      disconnectWebSocket();
    };
  }, [roomId]);

  const initializeRoom = async () => {
    try {
      // Get user info
      const user = authService.getUserInfo();
      const currentUserId = user.userId;
      setUserId(currentUserId);
      setCurrentUserId(currentUserId); // Set in Zustand store for WebSocket filtering
      console.log('Initializing room with userId:', currentUserId);

      // Connect to WebSocket
      const token = authService.getToken();
      connectWebSocket(roomId, token);

      // Fetch complete room state (includes playback state + queue with votes)
      await fetchRoomState();
      
      // Fetch members to determine user role
      await fetchMembers(currentUserId);

      // Start periodic sync if user is host (every 30 seconds)
      // Check user role after fetching members
    } catch (error) {
      console.error('Failed to initialize room:', error);
    }
  };
  
  const fetchRoomState = async () => {
    try {
      const state = await roomService.getRoomState(roomId);
      console.log('Fetched room state:', state);
      
      // Set room state (for video player sync popup)
      setRoomState({
        currentVideoId: state.currentVideoId,
        playbackPosition: state.playbackPosition,
        isPlaying: state.isPlaying,
        lastSyncTimestamp: state.lastSyncTimestamp,
      });
      
      // Set queue with real-time votes
      setQueue(state.queue || []);
      
      // Set current video if one is playing
      if (state.currentVideoId && state.queue) {
        const currentQueueItem = state.queue.find(
          item => item.video?.id === state.currentVideoId
        );
        if (currentQueueItem) {
          setCurrentVideo(currentQueueItem.video);
        }
      }
      
      // Set basic room info
      setCurrentRoom({ id: roomId, name: state.roomName || 'Room' });
    } catch (error) {
      console.error('Failed to fetch room state:', error);
      // Fallback to old methods
      await fetchRoomData();
      await fetchQueue();
    }
  };

  const fetchRoomData = async () => {
    try {
      // For now, using stored room data
      // TODO: Add getRoomById endpoint to backend
      const room = { id: roomId, name: 'Room' };
      setCurrentRoom(room);
    } catch (error) {
      console.error('Failed to fetch room data:', error);
    }
  };

  const fetchQueue = async () => {
    try {
      const queueData = await roomService.getQueue(roomId);
      setQueue(queueData);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    }
  };

  const fetchMembers = async (currentUserId) => {
    try {
      const members = await roomService.getRoomMembers(roomId);
      console.log('Fetched members:', members);
      console.log('Current userId:', currentUserId || userId);
      setRoomMembers(members);
      
      // Use passed userId or state userId
      const userIdToCheck = currentUserId || userId;
      
      // Determine user role
      const  currentUserMember = await members.find(m => {
        console.log('Checking member:', m.user?.id, 'against userId:', userIdToCheck);
        return m.user?.id === userIdToCheck;
      });
      console.log('Current user member:', currentUserMember);
      if (currentUserMember) {
        console.log('Setting user role to:', currentUserMember.role);
        setUserRole(currentUserMember.role);
        // Note: userRole state won't update until next render (state setters are async)
      } else {
        console.warn('User not found in members list. userId:', userIdToCheck, 'members:', members);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  // Debounced search effect - auto-search after user stops typing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchService.searchVideosByTitle(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 1000); // 1 second delay after user stops typing

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Auto-scroll chat messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAddToQueue = async (videoId) => {
    try {
      await roomService.addToQueue(roomId, videoId);
      await fetchQueue();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to add to queue:', error);
      alert(error.message);
    }
  };

  const handleToggleVote = async (queueId) => {
    try {
      await roomService.toggleVote(roomId, queueId);
      await fetchQueue();
    } catch (error) {
      console.error('Failed to toggle vote:', error);
    }
  };

  const handleRemoveFromQueue = async (queueId) => {
    try {
      await roomService.removeFromQueue(roomId, queueId);
      await fetchQueue();
    } catch (error) {
      console.error('Failed to remove from queue:', error);
      alert(error.message);
    }
  };

  const handlePlayVideo = (video) => {
    console.log('Playing video:', video);
    setCurrentVideo(video);
    sendChangeVideo(roomId, video.id);
  };

  // Helper functions for chat
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: `msg-${Date.now()}`,
      userId: userId,
      username: currentRoom?.members?.find(m => m.userId === userId)?.username || 'You',
      role: userRole,
      text: newMessage,
      timestamp: new Date(),
      avatar: null
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Auto-scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const isHost = userRole === 'HOST' || userRole === 'ADMIN';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-md border-b border-purple-500/30 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={onLeave}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              ← Leave Room
            </button>
            <h1 className="text-2xl font-bold">{currentRoom?.name || 'Room'}</h1>
            <span className={`flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              {isHost ? '👑 Host' : '👤 Member'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-3 py-6 grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Video Player Section - Left Side */}
        <div className="lg:col-span-3 space-y-3 relative z-10">
          {/* Movie Search - Above Video Player */}
          <div className="relative z-50 bg-black/40 backdrop-blur-md rounded-lg border border-purple-500/30 p-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for movies..."
              className="w-full px-3 py-1.5 bg-gray-800 border border-purple-500/30 rounded-md focus:outline-none focus:border-green-500 text-sm"
            />
            {searching && (
              <p className="text-xs text-gray-400 mt-1">Searching...</p>
            )}

            {/* Search Results as Dropdown Overlay */}
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-[9999] left-0 right-0 top-full mt-2 max-h-96 overflow-y-auto bg-gray-900 border border-purple-500/30 rounded-xl shadow-2xl"
              >
                <div className="p-2 space-y-2">
                  {searchResults.map((video) => (
                    <div
                      key={video.id}
                      className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{video.title}</p>
                        <p className="text-sm text-gray-400">
                          {video.year} · {video.director}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          handleAddToQueue(video.id);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="ml-3 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Video Player */}
          <div className="relative z-0 bg-black/40 backdrop-blur-md rounded-xl border border-purple-500/30 p-6 min-h-[calc(100vh-30rem)]">
            {currentVideo ? (
              <VideoPlayer
                video={currentVideo}
                roomId={roomId}
                isHost={isHost}
                videoUrl={currentVideo?.mediaUrl || currentVideo?.mediaurl || currentVideo?.url || currentVideo?.videoUrl}
                thumbnail={currentVideo?.thumbnailUrl || currentVideo?.thumbnailurl || currentVideo?.thumbnail}
              />
            ) : (
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center min-h-[calc(100vh-32rem)]">
                <p className="text-gray-400">No video selected. Choose from queue or search for movies.</p>
              </div>
            )}
          </div>
        </div>

        {/* Queue & Chat Section - Right Side */}
        <div className="space-y-4">
          {/* Queue */}
          <div className="bg-black/40 backdrop-blur-md rounded-xl border border-purple-500/30 p-4">
            <h2 className="text-xl font-bold mb-4">📋 Queue</h2>

            {queue.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Queue is empty. Add movies to get started!</p>
            ) : (
              <div className="space-y-3 max-h-[30vh] overflow-y-auto">
                {queue.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-700/50 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.video?.title}</h3>
                        <p className="text-xs text-gray-400">{item.video?.year}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleVote(item.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-purple-600/50 hover:bg-purple-600 rounded-lg transition text-sm"
                        >
                          👍 {item.totalVotes}
                        </button>
                        {isHost && (
                          <>
                            <button
                              onClick={() => handlePlayVideo(item.video)}
                              className="px-3 py-1 bg-green-600/50 hover:bg-green-600 rounded-lg transition text-sm"
                            >
                              ▶️
                            </button>
                            <button
                              onClick={() => handleRemoveFromQueue(item.id)}
                              className="px-3 py-1 bg-red-600/50 hover:bg-red-600 rounded-lg transition text-sm"
                            >
                              ❌
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Added by {item.addedBy?.username || 'Unknown'}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Live Chat Section */}
          <div className="bg-black/40 backdrop-blur-md border border-purple-500/30 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-28rem)]">
            {/* Header */}
            <div className="p-4 border-b border-purple-500/30">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-green-400">💬 Live Chat</h2>
                <span className="text-sm text-gray-400">
                  {roomMembers?.length || 0} members
                </span>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3"
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                                  ${message.role === 'HOST' ? 'bg-gradient-to-br from-green-400 to-emerald-500' :
                                    'bg-gradient-to-br from-purple-400 to-pink-500'}`}>
                    {message.username.charAt(0).toUpperCase()}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold text-sm ${message.role === 'HOST' ? 'text-green-400' : 'text-white'}`}>
                        {message.username}
                      </span>

                      {/* Role Badge */}
                      {message.role === 'HOST' && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded">
                          HOST
                        </span>
                      )}

                      {/* Timestamp */}
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>

                    {/* Message Text */}
                    <p className="text-sm text-gray-300 break-words">{message.text}</p>
                  </div>
                </motion.div>
              ))}

              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-purple-500/30">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Send a message..."
                  className="flex-1 px-4 py-2 bg-gray-800 border border-purple-500/30 rounded-lg
                             focus:outline-none focus:border-green-500 text-white placeholder-gray-400"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700
                             disabled:cursor-not-allowed rounded-lg transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomInterior;
