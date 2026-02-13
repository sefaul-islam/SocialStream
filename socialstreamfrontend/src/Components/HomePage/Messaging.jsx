import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import messagingService from '../../services/messagingService';
import socialService from '../../services/socialService';
import authService from '../../services/authService';
import useMessageStore from '../../stores/useMessageStore';

const REACTION_EMOJIS = [
  { type: 'LIKE', display: '👍' },
  { type: 'LOVE', display: '❤️' },
  { type: 'HAHA', display: '😂' },
  { type: 'WOW', display: '😮' },
  { type: 'SAD', display: '😢' }
];

const Messaging = () => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [conversationSummaries, setConversationSummaries] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [typingTimer, setTypingTimer] = useState(null);
  const [isUserTyping, setIsUserTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const reactionPickerRef = useRef(null);
  const currentUser = authService.getUserInfo();

  // Helper to get friend ID from conversation or friend object
  const getFriendId = (item) => {
    return item.friendId || item.id || item.participant?.id;
  };

  // Message store
  const {
    conversations: messageConversations,
    isConnected,
    typingIndicators,
    unreadConversations,
    sendMessage: sendWebSocketMessage,
    sendTypingIndicator,
    sendReaction,
    updateMessage,
    playReactionSound,
    setConversationMessages,
    prependMessages,
    markConversationAsRead,
  } = useMessageStore();

  // Load conversations and friends on mount
  useEffect(() => {
    loadConversations();
    loadFriends();
  }, []);

  // Listen for new messages and update conversation list
  useEffect(() => {
    const updatedSummaries = [...conversationSummaries];
    let hasChanges = false;

    messageConversations.forEach((messages, friendId) => {
      if (!messages || messages.length === 0) return;

      const lastMessage = messages[messages.length - 1];
      const existingIndex = updatedSummaries.findIndex(conv => conv.friendId === friendId);
      const unreadCount = unreadConversations.get(friendId) || 0;

      if (existingIndex !== -1) {
        // Update existing conversation
        const existing = updatedSummaries[existingIndex];
        if (existing.lastMessageTime !== lastMessage.timestamp || 
            existing.lastMessage !== lastMessage.message ||
            existing.unreadCount !== unreadCount) {
          
          updatedSummaries[existingIndex] = {
            ...existing,
            lastMessage: lastMessage.message,
            lastMessageTime: lastMessage.timestamp,
            unreadCount: unreadCount
          };
          hasChanges = true;
        }
      } else {
        // New conversation - fetch friend details
        const friend = friends.find(f => f.id === friendId);
        if (friend) {
          updatedSummaries.unshift({
            friendId: friendId,
            friendName: friend.username,
            friendProfilePicture: friend.profilePictureUrl || null,
            lastMessage: lastMessage.message,
            lastMessageTime: lastMessage.timestamp,
            unreadCount: unreadCount,
            type: 'conversation',
            participant: {
              id: friendId,
              name: friend.username,
              avatar: friend.profilePictureUrl || null,
              online: false
            }
          });
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      // Sort by last message time
      updatedSummaries.sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
      });
      setConversationSummaries(updatedSummaries);
    }
  }, [messageConversations, friends, unreadConversations]);

  // Close reaction picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target)) {
        // Check if click is not on the reaction button itself
        const isReactionButton = event.target.closest('button')?.textContent?.includes('🙂');
        if (!isReactionButton) {
          setShowReactionPicker(null);
        }
      }
    };

    if (showReactionPicker !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showReactionPicker]);

  // Load conversation summaries
  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const summaries = await messagingService.getConversations();
      setConversationSummaries(summaries);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load friends list
  const loadFriends = async () => {
    try {
      const friendsList = await socialService.getMyFriends();
      setFriends(friendsList);
    } catch (err) {
      console.error('Error loading friends:', err);
    }
  };

  // Load messages for selected friend
  const loadMessages = async (friendId, page = 0) => {
    try {
      setLoadingMessages(true);
      const response = await messagingService.getConversation(friendId, page, 20);
      
      if (page === 0) {
        // First load - set messages
        setConversationMessages(friendId, response.content);
      } else {
        // Pagination - prepend older messages
        prependMessages(friendId, response.content);
      }
      
      setHasMoreMessages(!response.last);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err.message);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Handle friend selection
  const handleSelectFriend = (friend) => {
    const friendId = getFriendId(friend);
    if (!friendId) {
      console.error('Invalid friend object - missing ID:', friend);
      setError('Unable to load conversation');
      return;
    }
    setSelectedFriend(friend);
    setCurrentPage(0);
    setHasMoreMessages(true);
    setIsMobileView(true);
    loadMessages(friendId, 0);
    
    // Mark conversation as read
    markConversationAsRead(friendId);
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedFriend || sendingMessage) return;

    const recipientId = getFriendId(selectedFriend);
    if (!recipientId) {
      setError('Invalid recipient');
      return;
    }
    const content = messageInput.trim();

    try {
      setSendingMessage(true);
      setError(null);

      // Try WebSocket first
      const sent = sendWebSocketMessage(recipientId, content);
      
      if (!sent) {
        // Fallback to REST API
        await messagingService.sendMessage(recipientId, content);
        // Reload messages to include the new one
        await loadMessages(recipientId, 0);
      }

      setMessageInput('');
      setIsUserTyping(false);
      
      // Update conversation list
      await loadConversations();
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle typing indicator
  useEffect(() => {
    if (!selectedFriend) return;

    const friendId = getFriendId(selectedFriend);
    if (!friendId) return;

    if (messageInput.length > 0) {
      setIsUserTyping(true);
      
      // Send typing indicator
      sendTypingIndicator(friendId, true);

      // Clear previous timer
      if (typingTimer) {
        clearTimeout(typingTimer);
      }

      // Stop typing after 3 seconds
      const timer = setTimeout(() => {
        setIsUserTyping(false);
        sendTypingIndicator(friendId, false);
      }, 3000);

      setTypingTimer(timer);
    } else {
      setIsUserTyping(false);
      sendTypingIndicator(friendId, false);
    }

    return () => {
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
    };
  }, [messageInput, selectedFriend]);

  // Handle reaction
  const handleToggleReaction = async (messageId, reactionType) => {
    try {
      // Find the message to determine recipient
      const message = currentMessages.find(m => m.id === messageId);
      if (!message) return;

      const recipientId = message.senderId === currentUser?.userId
        ? message.recipientId
        : message.senderId;

      // WebSocket first
      const sent = sendReaction(recipientId, messageId, reactionType);

      if (sent) {
        // Optimistic update
        updateMessage(messageId, { reaction: reactionType });
        playReactionSound();
      } else {
        // Fallback to REST
        await messagingService.addReaction(messageId, reactionType);
        if (selectedFriend) {
          const friendId = getFriendId(selectedFriend);
          if (friendId) {
            await loadMessages(friendId, currentPage);
          }
        }
      }

      setShowReactionPicker(null);
    } catch (err) {
      console.error('Error adding reaction:', err);
      setError(err.message);
    }
  };

  // Load more messages (pagination)
  const handleLoadMore = () => {
    if (selectedFriend && hasMoreMessages && !loadingMessages) {
      const friendId = getFriendId(selectedFriend);
      if (friendId) {
        loadMessages(friendId, currentPage + 1);
      }
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (selectedFriend && currentPage === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messageConversations, selectedFriend, typingIndicators]);

  // Get messages for selected friend
  const selectedFriendId = selectedFriend ? getFriendId(selectedFriend) : null;
  const currentMessages = selectedFriendId 
    ? messageConversations.get(selectedFriendId) || []
    : [];

  // Check if friend is typing
  const friendTypingIndicator = selectedFriendId 
    ? typingIndicators.get(selectedFriendId)
    : null;

  // Combine conversations and friends for display
  const allConversations = [
    ...conversationSummaries.map(conv => ({
      ...conv,
      type: 'conversation',
      participant: {
        id: conv.friendId,
        name: conv.friendName,
        avatar: conv.friendProfilePicture,
        online: false // We don't have online status yet
      }
    })),
    // Add friends who haven't been messaged yet
    ...friends
      .filter(friend => friend && friend.id && !conversationSummaries.some(conv => conv.friendId === friend.id))
      .map(friend => ({
        friendId: friend.id,
        friendName: friend.username,
        friendProfilePicture: friend.profilePictureUrl || null,
        lastMessage: null,
        lastMessageTime: null,
        type: 'friend',
        participant: {
          id: friend.id,
          name: friend.username,
          avatar: friend.profilePictureUrl || null,
          online: false
        }
      }))
  ];

  // Filter conversations based on search
  const filteredConversations = allConversations.filter(conv => {
    const searchLower = searchQuery.toLowerCase();
    return searchQuery === '' ||
      conv.friendName?.toLowerCase().includes(searchLower) ||
      conv.lastMessage?.toLowerCase().includes(searchLower);
  });

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  // Format message timestamp
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderAvatar = (participant, size = 'w-10 h-10') => {
    if (!participant) return null;

    return (
      <div className="relative">
        {participant.avatar ? (
          <img
            src={participant.avatar}
            alt={participant.name}
            className={`${size} rounded-full object-cover`}
          />
        ) : (
          <div className={`${size} rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold`}>
            {participant.name?.charAt(0).toUpperCase()}
          </div>
        )}
        {participant.online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full animate-pulse"></span>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-md border-b border-purple-500/30 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-center text-green-400 flex-1">Direct Messages</h1>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Connected
              </span>
            ) : (
              <span className="text-xs text-red-400">Disconnected</span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 m-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Conversation List */}
        <div className={`w-full lg:w-1/3 border-r border-purple-500/30 flex flex-col ${selectedFriend && isMobileView ? 'hidden lg:flex' : 'flex'}`}>
          {/* Search Bar */}
          <div className="p-4 border-b border-purple-500/30">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-purple-500/30 rounded-lg focus:outline-none focus:border-green-500 text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-center">No conversations yet. Start chatting with your friends!</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredConversations.map((conv, index) => {
                  const convId = getFriendId(conv);
                  return (
                  <motion.div
                    key={convId || `conv-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectFriend(conv)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedFriendId === convId
                        ? 'bg-green-500/20 border-l-4 border-green-400'
                        : 'bg-gray-800/30 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {renderAvatar(conv.participant)}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-white truncate">
                            {conv.friendName}
                          </h3>
                          {conv.lastMessageTime && (
                            <span className="text-xs text-gray-400 ml-2">
                              {formatTimestamp(conv.lastMessageTime)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-400 truncate">
                            {conv.lastMessage || 'Start a conversation'}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Chat View */}
        <div className={`flex-1 flex flex-col ${!selectedFriend || !isMobileView ? 'hidden lg:flex' : 'flex'}`}>
          {selectedFriend ? (
            <>
              {/* Chat Header */}
              <div className="bg-black/40 backdrop-blur-md border-b border-purple-500/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsMobileView(false)}
                      className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    {renderAvatar(selectedFriend.participant || { 
                      name: selectedFriend.friendName,
                      avatar: selectedFriend.friendProfilePicture 
                    })}
                    <div>
                      <h2 className="font-bold">{selectedFriend.friendName}</h2>
                      {friendTypingIndicator?.isTyping && (
                        <p className="text-xs text-green-400">typing...</p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const friendId = getFriendId(selectedFriend);
                      if (friendId) loadMessages(friendId, 0);
                    }}
                    className="p-2 hover:bg-gray-800 rounded-lg transition"
                    title="Refresh messages"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages Container */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Load More Button */}
                {hasMoreMessages && currentMessages.length > 0 && (
                  <div className="text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMessages}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm disabled:opacity-50"
                    >
                      {loadingMessages ? 'Loading...' : 'Load older messages'}
                    </button>
                  </div>
                )}

                {loadingMessages && currentMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                  </div>
                ) : currentMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  currentMessages.map((message) => {
                    const isOwnMessage = message.senderId === currentUser?.userId;
                    const reactionDisplay = message.reaction 
                      ? REACTION_EMOJIS.find(r => r.type === message.reaction)?.display 
                      : null;

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-2 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className="flex flex-col">
                            <div className="relative group">
                              <div
                                className={`px-4 py-2 rounded-lg ${
                                  isOwnMessage
                                    ? 'bg-green-600/30 text-white'
                                    : 'bg-gray-800 text-white'
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words">{message.message}</p>
                              </div>

                              {/* React Button */}
                              <motion.button
                                onClick={() => setShowReactionPicker(showReactionPicker === message.id ? null : message.id)}
                                className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800/80 hover:bg-gray-700 rounded-full p-2 shadow-lg ${
                                  isOwnMessage 
                                    ? 'left-0 -translate-x-1/2' 
                                    : 'right-0 translate-x-1/2'
                                }`}
                                whileHover={{ y: -5, scale: 1.1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              >
                                <span className="text-xl">🙂</span>
                              </motion.button>

                              {/* Reaction Picker */}
                              <AnimatePresence>
                                {showReactionPicker === message.id && (
                                  <motion.div
                                    ref={reactionPickerRef}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className={`absolute top-full mt-2 bg-gray-800 border border-purple-500/30 rounded-lg p-2 flex gap-1 z-10 shadow-xl ${
                                      isOwnMessage ? 'right-0' : 'left-0'
                                    }`}
                                  >
                                    {REACTION_EMOJIS.map(reaction => (
                                      <motion.button
                                        key={reaction.type}
                                        onClick={() => handleToggleReaction(message.id, reaction.type)}
                                        className="hover:bg-gray-700 rounded p-1 text-lg transition"
                                        whileHover={{ y: -8, scale: 1.2 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                      >
                                        {reaction.display}
                                      </motion.button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Reaction Display */}
                            {reactionDisplay && (
                              <div className="flex gap-1 mt-1 px-1">
                                <div className="px-2 py-0.5 rounded-full text-xs flex items-center gap-1 bg-gray-700/50">
                                  <span>{reactionDisplay}</span>
                                </div>
                              </div>
                            )}

                            <span className={`text-xs text-gray-500 mt-1 px-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                              {formatMessageTime(message.timestamp)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}

                {/* Typing Indicator */}
                <AnimatePresence>
                  {friendTypingIndicator?.isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className="flex justify-start"
                    >
                      <div className="flex gap-2 items-end">
                        {/* Avatar */}
                        {selectedFriend?.participant && (
                          <div className="flex-shrink-0">
                            {selectedFriend.participant.avatar ? (
                              <img
                                src={selectedFriend.participant.avatar}
                                alt={selectedFriend.participant.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                                {selectedFriend.participant.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Typing Bubble */}
                        <div className="bg-gray-800 rounded-lg px-4 py-3 flex items-center gap-1">
                          <motion.div
                            className="flex gap-1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <motion.span
                              className="w-2 h-2 bg-gray-400 rounded-full"
                              animate={{
                                y: [0, -6, 0],
                                backgroundColor: ['#9CA3AF', '#6EE7B7', '#9CA3AF']
                              }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0
                              }}
                            />
                            <motion.span
                              className="w-2 h-2 bg-gray-400 rounded-full"
                              animate={{
                                y: [0, -6, 0],
                                backgroundColor: ['#9CA3AF', '#6EE7B7', '#9CA3AF']
                              }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.1
                              }}
                            />
                            <motion.span
                              className="w-2 h-2 bg-gray-400 rounded-full"
                              animate={{
                                y: [0, -6, 0],
                                backgroundColor: ['#9CA3AF', '#6EE7B7', '#9CA3AF']
                              }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.2
                              }}
                            />
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-black/40 backdrop-blur-md border-t border-purple-500/30 p-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1 bg-gray-800 border border-purple-500/30 rounded-lg px-4 py-2 focus-within:border-green-500 transition">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      rows="1"
                      className="w-full bg-transparent outline-none text-white placeholder-gray-400 resize-none max-h-24"
                      disabled={sendingMessage}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendingMessage}
                    className="p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition flex items-center justify-center"
                  >
                    {sendingMessage ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-lg">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messaging;
