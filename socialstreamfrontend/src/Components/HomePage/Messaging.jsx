import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock data
const mockUsers = [
  { id: 1, name: 'Alice Morgan', username: 'alice', avatar: null, online: true },
  { id: 2, name: 'Bob Chen', username: 'bob', avatar: null, online: false },
  { id: 3, name: 'Charlie Davis', username: 'charlie', avatar: null, online: true },
  { id: 4, name: 'Diana Prince', username: 'diana', avatar: null, online: true },
  { id: 6, name: 'Frank Miller', username: 'frank', avatar: null, online: false },
];

const mockConversations = [
  {
    id: 'conv-1',
    type: 'direct',
    participant: { id: 1, name: 'Alice Morgan', username: 'alice', online: true },
    lastMessage: { text: 'Hey! Are you watching that new movie?', timestamp: '2m ago', senderId: 1 },
    unreadCount: 2,
    messages: [
      {
        id: 'msg-1',
        senderId: 1,
        senderName: 'Alice Morgan',
        text: 'Hey! Are you watching that new movie?',
        timestamp: '10:30 AM',
        reactions: [{ emoji: '👍', count: 2, userReacted: false }],
      },
      {
        id: 'msg-2',
        senderId: 'me',
        senderName: 'You',
        text: 'Not yet! Is it good?',
        timestamp: '10:32 AM',
        reactions: [],
      },
      {
        id: 'msg-3',
        senderId: 1,
        senderName: 'Alice Morgan',
        text: 'It\'s amazing! You should definitely check it out. The cinematography is stunning 🎬',
        timestamp: '10:33 AM',
        reactions: [{ emoji: '❤️', count: 1, userReacted: true }],
      },
    ]
  },
  {
    id: 'conv-2',
    type: 'direct',
    participant: { id: 3, name: 'Charlie Davis', username: 'charlie', online: true },
    lastMessage: { text: 'Thanks for the recommendation!', timestamp: '1h ago', senderId: 3 },
    unreadCount: 0,
    messages: [
      {
        id: 'msg-4',
        senderId: 'me',
        senderName: 'You',
        text: 'You should watch Inception, it\'s a masterpiece',
        timestamp: '9:15 AM',
        reactions: [],
      },
      {
        id: 'msg-5',
        senderId: 3,
        senderName: 'Charlie Davis',
        text: 'Thanks for the recommendation!',
        timestamp: '9:20 AM',
        reactions: [{ emoji: '🙏', count: 1, userReacted: false }],
      },
    ]
  },
  {
    id: 'conv-4',
    type: 'direct',
    participant: { id: 4, name: 'Diana Prince', username: 'diana', online: true },
    lastMessage: { text: 'See you there!', timestamp: 'Yesterday', senderId: 4 },
    unreadCount: 0,
    messages: [
      {
        id: 'msg-8',
        senderId: 'me',
        senderName: 'You',
        text: 'Want to join the movie room tonight?',
        timestamp: 'Yesterday',
        reactions: [],
      },
      {
        id: 'msg-9',
        senderId: 4,
        senderName: 'Diana Prince',
        text: 'See you there!',
        timestamp: 'Yesterday',
        reactions: [{ emoji: '😂', count: 1, userReacted: false }],
      },
    ]
  },
  {
    id: 'conv-5',
    type: 'direct',
    participant: { id: 6, name: 'Frank Miller', username: 'frank', online: false },
    lastMessage: { text: 'Catch you later!', timestamp: '2 days ago', senderId: 6 },
    unreadCount: 0,
    messages: [
      {
        id: 'msg-10',
        senderId: 6,
        senderName: 'Frank Miller',
        text: 'Hey, want to watch something tonight?',
        timestamp: '2 days ago',
        reactions: [],
      },
      {
        id: 'msg-11',
        senderId: 'me',
        senderName: 'You',
        text: 'I\'m busy tonight, maybe tomorrow?',
        timestamp: '2 days ago',
        reactions: [],
      },
      {
        id: 'msg-12',
        senderId: 6,
        senderName: 'Frank Miller',
        text: 'Catch you later!',
        timestamp: '2 days ago',
        reactions: [],
      },
    ]
  },
];

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const Messaging = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [conversations, setConversations] = useState(mockConversations);
  const [isTyping, setIsTyping] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' ||
      (conv.participant?.name?.toLowerCase().includes(searchLower)) ||
      (conv.lastMessage?.text?.toLowerCase().includes(searchLower));

    return matchesSearch;
  });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  // Simulate typing indicator
  useEffect(() => {
    if (messageInput.length > 0 && selectedConversation) {
      setIsTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    } else {
      setIsTyping(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageInput, selectedConversation]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      senderName: 'You',
      text: messageInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: [],
    };

    setConversations(prevConversations =>
      prevConversations.map(conv =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastMessage: { text: messageInput, timestamp: 'Just now', senderId: 'me' }
            }
          : conv
      )
    );

    setSelectedConversation(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));

    setMessageInput('');
    setIsTyping(false);
  };

  const handleToggleReaction = (messageId, emoji) => {
    if (!selectedConversation) return;

    setConversations(prevConversations =>
      prevConversations.map(conv =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === messageId
                  ? {
                      ...msg,
                      reactions: msg.reactions.find(r => r.emoji === emoji)
                        ? msg.reactions.map(r =>
                            r.emoji === emoji
                              ? { ...r, count: r.userReacted ? r.count - 1 : r.count + 1, userReacted: !r.userReacted }
                              : r
                          ).filter(r => r.count > 0)
                        : [...msg.reactions, { emoji, count: 1, userReacted: true }]
                    }
                  : msg
              )
            }
          : conv
      )
    );

    setSelectedConversation(prev => ({
      ...prev,
      messages: prev.messages.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              reactions: msg.reactions.find(r => r.emoji === emoji)
                ? msg.reactions.map(r =>
                    r.emoji === emoji
                      ? { ...r, count: r.userReacted ? r.count - 1 : r.count + 1, userReacted: !r.userReacted }
                      : r
                  ).filter(r => r.count > 0)
                : [...msg.reactions, { emoji, count: 1, userReacted: true }]
            }
          : msg
      )
    }));

    setShowReactionPicker(null);
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
        <h1 className="text-xl font-bold text-center text-green-400">Direct Messages</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Conversation List */}
        <div className={`w-full lg:w-1/3 border-r border-purple-500/30 flex flex-col ${selectedConversation && isMobileView ? 'hidden lg:flex' : 'flex'}`}>
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
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>No conversations found</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredConversations.map((conv, index) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      setSelectedConversation(conv);
                      setIsMobileView(true);
                    }}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedConversation?.id === conv.id
                        ? 'bg-green-500/20 border-l-4 border-green-400'
                        : 'bg-gray-800/30 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {renderAvatar(conv.participant)}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-white truncate">
                            {conv.participant?.name}
                          </h3>
                          <span className="text-xs text-gray-400 ml-2">{conv.lastMessage?.timestamp}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-400 truncate">
                            {conv.lastMessage?.text}
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
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Chat View */}
        <div className={`flex-1 flex flex-col ${!selectedConversation || !isMobileView ? 'hidden lg:flex' : 'flex'}`}>
          {selectedConversation ? (
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
                    {renderAvatar(selectedConversation.participant)}
                    <div>
                      <h2 className="font-bold">{selectedConversation.participant?.name}</h2>
                      <p className="text-xs text-gray-400">
                        {selectedConversation.participant?.online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-800 rounded-lg transition">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[70%] ${message.senderId === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="flex flex-col">
                        <div className="relative group">
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              message.senderId === 'me'
                                ? 'bg-green-600/30 text-white'
                                : 'bg-gray-800 text-white'
                            }`}
                          >
                            <p>{message.text}</p>
                          </div>

                          {/* React Button */}
                          <button
                            onClick={() => setShowReactionPicker(showReactionPicker === message.id ? null : message.id)}
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600 rounded-full p-1"
                          >
                            <span className="text-xs">+</span>
                          </button>

                          {/* Reaction Picker */}
                          <AnimatePresence>
                            {showReactionPicker === message.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute top-full mt-2 bg-gray-800 border border-purple-500/30 rounded-lg p-2 flex gap-1 z-10 shadow-xl"
                              >
                                {REACTION_EMOJIS.map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleToggleReaction(message.id, emoji)}
                                    className="hover:bg-gray-700 rounded p-1 text-lg transition"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Reactions */}
                        {message.reactions.length > 0 && (
                          <div className="flex gap-1 mt-1 px-1">
                            {message.reactions.map((reaction, idx) => (
                              <motion.button
                                key={idx}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                onClick={() => handleToggleReaction(message.id, reaction.emoji)}
                                className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition ${
                                  reaction.userReacted
                                    ? 'bg-green-500/30 border border-green-500/50'
                                    : 'bg-gray-700/50 hover:bg-gray-700'
                                }`}
                              >
                                <span>{reaction.emoji}</span>
                                <span>{reaction.count}</span>
                              </motion.button>
                            ))}
                          </div>
                        )}

                        <span className={`text-xs text-gray-500 mt-1 px-1 ${message.senderId === 'me' ? 'text-right' : 'text-left'}`}>
                          {message.timestamp}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="text-sm text-gray-400 italic flex items-center gap-2">
                      <span>{selectedConversation.participant?.name?.split(' ')[0]} is typing</span>
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}

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
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
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
