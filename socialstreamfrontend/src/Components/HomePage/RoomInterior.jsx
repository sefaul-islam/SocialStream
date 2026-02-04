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

  const isHost = userRole === 'HOST' || userRole === 'ADMIN';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
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

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player Section - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          <div className="bg-black/40 backdrop-blur-md rounded-xl border border-purple-500/30 p-6">
            {currentVideo ? (
              <VideoPlayer
                video={currentVideo}
                roomId={roomId}
                isHost={isHost}
                videoUrl={currentVideo?.mediaUrl || currentVideo?.mediaurl || currentVideo?.url || currentVideo?.videoUrl}
                thumbnail={currentVideo?.thumbnailUrl || currentVideo?.thumbnailurl || currentVideo?.thumbnail}
              />
            ) : (
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">No video selected. Choose from queue or search for movies.</p>
              </div>
            )}
          </div>

          {/* Movie Search */}
          <div className="bg-black/40 backdrop-blur-md rounded-xl border border-purple-500/30 p-6">
            <h2 className="text-xl font-bold mb-4">🔍 Search Movies</h2>
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for movies... (starts searching automatically)"
                className="w-full px-4 py-2 bg-gray-800 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500"
              />
              {searching && (
                <p className="text-sm text-gray-400 mt-2">Searching...</p>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{video.title}</h3>
                      <p className="text-sm text-gray-400">
                        {video.year} | {video.director}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddToQueue(video.id)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition text-sm"
                    >
                      + Add to Queue
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Queue & Members Section - Right Side */}
        <div className="space-y-6">
          {/* Queue */}
          <div className="bg-black/40 backdrop-blur-md rounded-xl border border-purple-500/30 p-6">
            <h2 className="text-xl font-bold mb-4">📋 Queue</h2>
            
            {queue.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Queue is empty. Add movies to get started!</p>
            ) : (
              <div className="space-y-3">
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

          {/* Members */}
          <div className="bg-black/40 backdrop-blur-md rounded-xl border border-purple-500/30 p-6">
            <h2 className="text-xl font-bold mb-4">👥 Members</h2>
            {roomMembers.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Loading members...</p>
            ) : (
              <div className="space-y-2">
                {roomMembers.map((member) => {
                  const isOnline = onlineMembers.includes(member.user?.id);
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
                        }`}></span>
                        <span>{member.user?.username}</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-purple-600/30 rounded">
                        {member.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomInterior;
