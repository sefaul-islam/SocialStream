import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SuccessNotification from '../shared/SuccessNotification';
import postService from '../../services/postService';
import authService from '../../services/authService';
import newsfeedService from '../../services/newsfeedService';

const NewsFeed = () => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');
  const [showMediaSearch, setShowMediaSearch] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [contentError, setContentError] = useState('');
  const [mediaType, setMediaType] = useState('VIDEO'); // VIDEO or AUDIO
  
  // State for fetching friends' posts
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch friends' posts on component mount
  useEffect(() => {
    const fetchFriendsPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const friendsPosts = await newsfeedService.getFriendsPosts();
        
        // Transform backend data to match UI expectations
        const transformedPosts = friendsPosts.map(post => ({
          id: post.id,
          user: {
            name: post.user.username || 'Unknown User',
            avatar: post.user.profilePictureUrl || 'https://i.pravatar.cc/150?img=1',
            time: formatTimeAgo(post.uploadDate)
          },
          content: post.description || '',
          media: {
            id: post.media.id,
            type: post.media.mediaType?.toLowerCase() === 'audio' ? 'music' : 'movie',
            title: post.media.title,
            thumbnail: post.media.thumbnailUrl,
            videoUrl: post.media.mediaUrl,
            genre: post.media.genre || 'N/A',
            rating: post.media.rating ? post.media.rating.toString() : 'N/A',
            year: post.media.releaseYear ? post.media.releaseYear.toString() : 'N/A',
            duration: post.media.durationInSeconds ? `${Math.floor(post.media.durationInSeconds / 60)}m` : 'N/A',
            description: post.media.description || '',
            director: post.media.director || '',
            artist: post.media.artist || '',
            cast: post.media.cast || [],
            views: post.media.views || post.media.streamCount ? 
              `${((post.media.views || post.media.streamCount) / 1000000).toFixed(1)}M views` : '0 views',
            likes: post.media.likes || '0',
            uploadDate: formatTimeAgo(post.uploadDate)
          },
          likes: post.likesCount || 0,
          comments: post.comments?.length || 0
        }));
        
        setPosts(transformedPosts);
      } catch (err) {
        console.error('Failed to fetch friends posts:', err);
        setError(err.message || 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchFriendsPosts();
  }, []);

  // Helper function to format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
      return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays < 30) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Debounced search effect for media search with pattern matching
  useEffect(() => {
    if (!showMediaSearch || !mediaSearch.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        // Search for media by title pattern using the backend API
        const mediaData = await postService.searchMediaByTitle(mediaSearch.trim(), mediaType);
        
        // Validate that we received a valid ID from the backend
        if (!mediaData || !mediaData.id) {
          setSearchResults([]);
          return;
        }
        
        // Transform the backend response to match the UI format
        const searchResult = {
          id: mediaData.id, // Use the actual ID from backend DTO
          type: mediaType === 'AUDIO' ? 'music' : 'movie',
          title: mediaData.title,
          thumbnail: mediaData.thumbnailUrl,
          videoUrl: mediaData.mediaUrl,
          mediaType: mediaType, // Store the media type
          genre: mediaData.genre || 'N/A',
          rating: mediaData.rating ? mediaData.rating.toString() : 'N/A',
          year: mediaData.releaseYear ? mediaData.releaseYear.toString() : 'N/A',
          duration: mediaData.durationInSeconds ? `${Math.floor(mediaData.durationInSeconds / 60)}m` : 'N/A',
          description: mediaData.description,
          director: mediaData.director,
          artist: mediaData.artist, // For audio
          cast: mediaData.cast || [],
          views: mediaData.views || mediaData.streamCount ? 
            `${((mediaData.views || mediaData.streamCount) / 1000000).toFixed(1)}M views` : '0 views'
        };
        
        setSearchResults([searchResult]);
      } catch (err) {
        console.error('Media search error:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      setSearching(false);
    };
  }, [mediaSearch, mediaType, showMediaSearch]);

  // Search for media (video or audio) by title using the backend API
  const handleMediaSearch = async () => {
    if (!mediaSearch.trim()) return;

    try {
      setSearching(true);
      
      // Search for media by title using the backend API based on selected type
      const mediaData = await postService.searchMediaByTitle(mediaSearch.trim(), mediaType);
      
      // Validate that we received a valid ID from the backend
      if (!mediaData.id) {
        throw new Error('Invalid media data received from server');
      }
      
      // Transform the backend response to match the UI format
      const searchResult = {
        id: mediaData.id, // Use the actual ID from backend DTO
        type: mediaType === 'AUDIO' ? 'music' : 'movie',
        title: mediaData.title,
        thumbnail: mediaData.thumbnailUrl,
        videoUrl: mediaData.mediaUrl,
        mediaType: mediaType, // Store the media type
        genre: mediaData.genre || 'N/A',
        rating: mediaData.rating ? mediaData.rating.toString() : 'N/A',
        year: mediaData.uploadedAt ? new Date(mediaData.uploadedAt).getFullYear().toString() : 'N/A',
        duration: mediaData.durationInSeconds ? `${Math.floor(mediaData.durationInSeconds / 60)}m` : 'N/A',
        description: mediaData.description,
        director: mediaData.director,
        artist: mediaData.artist, // For audio
        cast: mediaData.cast || [],
        views: mediaData.views || mediaData.streamCount ? 
          `${((mediaData.views || mediaData.streamCount) / 1000000).toFixed(1)}M views` : '0 views'
      };
      
      setSearchResults([searchResult]);
    } catch (err) {
      console.error('Media search error:', err);
      setSearchResults([]);
      // Show error message to user
      setSuccessMessage(err.message || `${mediaType === 'AUDIO' ? 'Audio' : 'Video'} not found`);
      setShowSuccess(true);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectMedia = (media) => {
    setSelectedMedia(media);
    setShowMediaSearch(false);
    setMediaSearch('');
    setSearchResults([]);
  };

  const handleRemoveMedia = () => {
    setSelectedMedia(null);
  };

  const handlePostClick = () => {
    if (!newPostContent.trim()) {
      setContentError('Please enter some content for your post');
      return;
    }
    // Clear any previous errors
    setContentError('');
    // Show confirmation dialog
    setShowConfirmation(true);
  };

  const handleConfirmPost = async () => {
    try {
      setCreating(true);
      setShowConfirmation(false);
      
      // Validate user authentication
      const userInfo = authService.getUserInfo();
      if (!userInfo || !userInfo.userId) {
        throw new Error('Authentication required. Please login again.');
      }

      // Validate media selection
      if (!selectedMedia) {
        throw new Error('Please select a video to attach to your post');
      }

      // Validate media ID from backend response
      if (!selectedMedia.id) {
        throw new Error('Invalid media data. Please search and select the video again.');
      }

      // Validate post content
      if (!newPostContent.trim()) {
        throw new Error('Post content cannot be empty');
      }

      // Prepare post data
      const postData = {
        description: newPostContent.trim(),
        mediaType: selectedMedia.mediaType || 'VIDEO' // Use the media type from selected media
      };

      // Create post with media ID from backend DTO response
      await postService.createPost(postData, selectedMedia.id, userInfo.userId);
      
      // Refresh the posts list
      const friendsPosts = await newsfeedService.getFriendsPosts();
      const transformedPosts = friendsPosts.map(post => ({
        id: post.id,
        user: {
          name: post.user.username || 'Unknown User',
          avatar: post.user.profilePictureUrl || 'https://i.pravatar.cc/150?img=1',
          time: formatTimeAgo(post.uploadDate)
        },
        content: post.description || '',
        media: {
          id: post.media.id,
          type: post.media.mediaType?.toLowerCase() === 'audio' ? 'music' : 'movie',
          title: post.media.title,
          thumbnail: post.media.thumbnailUrl,
          videoUrl: post.media.mediaUrl,
          genre: post.media.genre || 'N/A',
          rating: post.media.rating ? post.media.rating.toString() : 'N/A',
          year: post.media.releaseYear ? post.media.releaseYear.toString() : 'N/A',
          duration: post.media.durationInSeconds ? `${Math.floor(post.media.durationInSeconds / 60)}m` : 'N/A',
          description: post.media.description || '',
          director: post.media.director || '',
          artist: post.media.artist || '',
          cast: post.media.cast || [],
          views: post.media.views || post.media.streamCount ? 
            `${((post.media.views || post.media.streamCount) / 1000000).toFixed(1)}M views` : '0 views',
          likes: post.media.likes || '0',
          uploadDate: formatTimeAgo(post.uploadDate)
        },
        likes: post.likesCount || 0,
        comments: post.comments?.length || 0
      }));
      setPosts(transformedPosts);
      
      // Add fade out animation before closing
      setTimeout(() => {
        // Reset form and close modal
        setNewPostContent('');
        setSelectedMedia(null);
        setShowCreateModal(false);
        
        // Show success notification
        setSuccessMessage('Post created successfully!');
        setShowSuccess(true);
        
        setCreating(false);
      }, 300);
    } catch (err) {
      console.error('Failed to create post:', err);
      
      // Determine appropriate error message
      let errorMessage = 'Failed to create post';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response) {
        // Handle HTTP errors
        if (err.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          // Optionally logout user
          authService.logout();
          window.location.href = '/auth';
        } else if (err.response.status === 404) {
          errorMessage = 'Media not found. Please select a different video.';
        } else if (err.response.status === 400) {
          errorMessage = err.response.data?.message || 'Invalid post data. Please try again.';
        } else if (err.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = `Error: ${err.response.status}. Please try again.`;
        }
      }
      
      setSuccessMessage(errorMessage);
      setShowSuccess(true);
      setCreating(false);
      setShowConfirmation(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="px-16 py-24 bg-black min-h-screen">
      {/* Success Notification */}
      <SuccessNotification
        message={successMessage}
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
        duration={3000}
      />

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Confirm Post</h2>
            </div>
            
            <p className="text-gray-400 mb-6">
              Are you sure you want to publish this post? It will be visible to all your followers.
            </p>
            
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirmPost}
                disabled={creating}
                className="flex-1 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl font-medium transition-all text-green-400 disabled:opacity-50"
              >
                {creating ? 'Publishing...' : 'Yes, Post'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancelConfirmation}
                disabled={creating}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all disabled:opacity-50"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Create New Post</h2>
            
            {/* Post Content */}
            <textarea
              placeholder="What's on your mind?"
              value={newPostContent}
              onChange={(e) => {
                setNewPostContent(e.target.value);
                if (contentError) setContentError('');
              }}
              className={`w-full px-4 py-3 bg-white/5 border rounded-xl focus:outline-none transition-all text-white placeholder-gray-500 mb-2 min-h-[120px] resize-none ${
                contentError ? 'border-red-500/50 focus:border-red-500/70' : 'border-white/10 focus:border-white/20'
              }`}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handlePostClick();
                }
              }}
            />
            {contentError && (
              <div className="mb-4 flex items-center gap-2 text-red-400 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{contentError}</span>
              </div>
            )}

            {/* Selected Media Preview */}
            {selectedMedia && (
              <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-start gap-4">
                  <img
                    src={selectedMedia.thumbnail}
                    alt={selectedMedia.title}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400 font-semibold mb-2">
                          {selectedMedia.type === 'movie' ? '🎬 Movie' : '🎵 Music'}
                        </span>
                        <h4 className="text-white font-bold">{selectedMedia.title}</h4>
                        {selectedMedia.artist && (
                          <p className="text-gray-400 text-sm">{selectedMedia.artist}</p>
                        )}
                        <p className="text-gray-500 text-sm">{selectedMedia.genre}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleRemoveMedia}
                        className="text-red-400 hover:text-red-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Media Search Section */}
            {!showMediaSearch && !selectedMedia && (
              <div className="flex gap-3 mb-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setMediaType('VIDEO');
                    setShowMediaSearch(true);
                  }}
                  className="flex-1 px-4 py-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl transition-all flex items-center justify-center gap-2 text-purple-400 hover:text-purple-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Add Video
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setMediaType('AUDIO');
                    setShowMediaSearch(true);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl transition-all flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  Add Audio
                </motion.button>
              </div>
            )}

            {/* Media Search UI */}
            {showMediaSearch && (
              <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-white font-semibold flex-1">Search Media</h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowMediaSearch(false);
                      setMediaSearch('');
                      setSearchResults([]);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                <div className="flex gap-2 mb-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Search for movies, music..."
                      value={mediaSearch}
                      onChange={(e) => setMediaSearch(e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/20 transition-all text-white placeholder-gray-500"
                    />
                    {searching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setMediaType('VIDEO')}
                      className={`px-3 py-2 rounded-lg font-medium transition-all ${
                        mediaType === 'VIDEO'
                          ? 'bg-purple-500/30 border border-purple-500/50 text-purple-300'
                          : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      🎬
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setMediaType('AUDIO')}
                      className={`px-3 py-2 rounded-lg font-medium transition-all ${
                        mediaType === 'AUDIO'
                          ? 'bg-blue-500/30 border border-blue-500/50 text-blue-300'
                          : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      🎵
                    </motion.button>
                  </div>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {searchResults.map((item) => (
                      <motion.div
                        key={item.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleSelectMedia(item)}
                        className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-all"
                      >
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <span className="inline-block px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400 font-semibold mb-1">
                            {item.type === 'movie' ? '🎬' : '🎵'}
                          </span>
                          <h4 className="text-white font-semibold text-sm">{item.title}</h4>
                          {item.artist && (
                            <p className="text-gray-400 text-xs">{item.artist}</p>
                          )}
                          <p className="text-gray-500 text-xs">{item.genre}</p>
                        </div>
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </motion.div>
                    ))}
                  </div>
                )}

                {searchResults.length === 0 && mediaSearch && !searching && (
                  <p className="text-gray-500 text-center py-4">No results found. Try a different search term.</p>
                )}
              </div>
            )}

            <p className="text-gray-500 text-sm mb-4">Press Ctrl+Enter to post</p>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePostClick}
                disabled={creating}
                className="flex-1 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-green-400"
              >
                {creating ? 'Posting...' : 'Post'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPostContent('');
                  setSelectedMedia(null);
                  setShowMediaSearch(false);
                  setMediaSearch('');
                  setSearchResults([]);
                }}
                className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">News Feed</h1>
          <p className="text-gray-400">See what your friends are sharing</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 text-green-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Post
        </motion.button>
      </div>
    

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Loading friends' posts...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-white font-semibold text-lg mb-2">Failed to Load Posts</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                setLoading(true);
                setError(null);
                try {
                  const friendsPosts = await newsfeedService.getFriendsPosts();
                  const transformedPosts = friendsPosts.map(post => ({
                    id: post.id,
                    user: {
                      name: post.user.username || 'Unknown User',
                      avatar: post.user.profilePictureUrl || 'https://i.pravatar.cc/150?img=1',
                      time: formatTimeAgo(post.uploadDate)
                    },
                    content: post.description || '',
                    media: {
                      id: post.media.id,
                      type: post.media.mediaType?.toLowerCase() === 'audio' ? 'music' : 'movie',
                      title: post.media.title,
                      thumbnail: post.media.thumbnailUrl,
                      videoUrl: post.media.mediaUrl,
                      genre: post.media.genre || 'N/A',
                      rating: post.media.rating ? post.media.rating.toString() : 'N/A',
                      year: post.media.releaseYear ? post.media.releaseYear.toString() : 'N/A',
                      duration: post.media.durationInSeconds ? `${Math.floor(post.media.durationInSeconds / 60)}m` : 'N/A',
                      description: post.media.description || '',
                      director: post.media.director || '',
                      artist: post.media.artist || '',
                      cast: post.media.cast || [],
                      views: post.media.views || post.media.streamCount ? 
                        `${((post.media.views || post.media.streamCount) / 1000000).toFixed(1)}M views` : '0 views',
                      likes: post.media.likes || '0',
                      uploadDate: formatTimeAgo(post.uploadDate)
                    },
                    likes: post.likesCount || 0,
                    comments: post.comments?.length || 0
                  }));
                  setPosts(transformedPosts);
                } catch (err) {
                  setError(err.message || 'Failed to load posts');
                } finally {
                  setLoading(false);
                }
              }}
              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-400 font-medium transition-all"
            >
              Try Again
            </motion.button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && posts.length === 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-white font-semibold text-xl mb-2">No Posts Yet</h3>
            <p className="text-gray-400 mb-4">Your friends haven't shared anything yet. Be the first to post!</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl font-medium transition-all text-green-400"
            >
              Create Your First Post
            </motion.button>
          </div>
        )}

        {/* Posts List */}
        {!loading && !error && posts.length > 0 && (
          <>
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white/5 backdrop-blur-lg rounded-2xl border border-green-500/20 overflow-hidden hover:border-green-500/40 transition-all duration-300"
          >
            {/* User Header */}
            <div className="p-6 flex items-center gap-4">
              <img
                src={post.user.avatar}
                alt={post.user.name}
                className="w-12 h-12 rounded-full border-2 border-green-500/30"
              />
              <div className="flex-1">
                <h3 className="text-white font-semibold">{post.user.name}</h3>
                <p className="text-gray-400 text-sm">{post.user.time}</p>
              </div>
              <button className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>

            {/* Post Content */}
            <div className="px-6 pb-4">
              <p className="text-white text-lg">{post.content}</p>
            </div>

            {/* Media Card */}
            <div 
              onClick={() => {
                if (post.media.type === 'movie') {
                  navigate(`/video/${post.media.id}`, {
                    state: {
                      video: {
                        id: post.media.id,
                        title: post.media.title,
                        videoUrl: post.media.videoUrl,
                        thumbnail: post.media.thumbnail,
                        description: post.media.description,
                        year: post.media.year,
                        duration: post.media.duration,
                        rating: parseFloat(post.media.rating),
                        genre: post.media.genre.split(', '),
                        director: post.media.director,
                        cast: post.media.cast,
                        views: post.media.views,
                        likes: post.media.likes,
                        uploadDate: post.media.uploadDate
                      }
                    }
                  });
                }
              }}
              className="mx-6 mb-6 bg-black/40 rounded-xl overflow-hidden border border-green-500/10 hover:border-green-500/30 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex gap-4 p-4">
                <div className="relative flex-shrink-0">
                  <img
                    src={post.media.thumbnail}
                    alt={post.media.title}
                    className="w-32 h-32 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300 rounded-lg flex items-center justify-center">
                    <div className="bg-green-500/80 group-hover:bg-green-500 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300">
                      {post.media.type === 'movie' ? (
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 18.7l.7-.7L18.6 9l.7-.7-.7-.7-1.4-1.4-.7-.7-.7.7-7.9 7.9-.7.7.7.7 1.4 1.4z" />
                          <path d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 16.5a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <div className="inline-block mb-2">
                    <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-400 font-semibold">
                      {post.media.type === 'movie' ? '🎬 Movie' : '🎵 Music'}
                    </span>
                  </div>
                  <h4 className="text-white font-bold text-xl mb-1 group-hover:text-green-400 transition-colors">
                    {post.media.title}
                  </h4>
                  {post.media.artist && (
                    <p className="text-gray-300 text-sm mb-2">{post.media.artist}</p>
                  )}
                  <p className="text-gray-400 text-sm">{post.media.genre}</p>
                  {post.media.rating && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-yellow-400">★</span>
                      <span className="text-white font-semibold">{post.media.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-green-500/10 flex items-center gap-6">
              <button className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="font-semibold">{post.likes}</span>
              </button>
              <button className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="font-semibold">{post.comments}</span>
              </button>
              <button className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors ml-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="font-semibold">Share</span>
              </button>
            </div>
          </div>
        ))}
          </>
        )}
      </div>
    </div>
  );
};

export default NewsFeed;
