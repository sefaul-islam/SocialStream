import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/userService';
import authService from '../../services/authService';
import cloudinaryService from '../../services/cloudinaryService';
import SuccessNotification from '../shared/SuccessNotification';

const Profile = ({ user, onClose }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [currentAvatar, setCurrentAvatar] = useState(user?.avatar || null);
  const fileInputRef = useRef(null);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'settings', label: 'Settings' },
  ];
  // Initialize avatar from user prop or auth service
  useEffect(() => {
    const userInfo = authService.getUserInfo();
    const avatarUrl = user?.avatar || userInfo?.profilePictureUrl || null;
    setCurrentAvatar(avatarUrl);
  }, [user]);
  // Handle profile picture upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadError(null);

      // Upload to Cloudinary
      const cloudinaryResult = await cloudinaryService.uploadImage(file, 'profile_pictures');
      
      // Update backend with new profile picture URL
      const updatedUser = await userService.uploadProfilePicture(cloudinaryResult.url);
      
      // Update local state immediately
      setCurrentAvatar(cloudinaryResult.url);
      
      // Update user info in auth service to persist the avatar across the app
      const currentUserInfo = authService.getUserInfo();
      if (currentUserInfo) {
        currentUserInfo.profilePictureUrl = cloudinaryResult.url;
        authService.setUserInfo(currentUserInfo);
      }
      
      // Show success notification
      setUploadSuccess(true);
      
      console.log('Profile picture updated successfully:', updatedUser);
    } catch (err) {
      console.error('Failed to upload profile picture:', err);
      setUploadError(err.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEditProfileClick = () => {
    fileInputRef.current?.click();
  };

  // Fetch user's posts from backend
  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user info
        const currentUser = authService.getUserInfo();
        console.log('Current user info:', currentUser);
        
        if (!currentUser || !currentUser.userId) {
          throw new Error('User not authenticated');
        }

        // Fetch posts from backend
        console.log('Fetching posts for user ID:', currentUser.userId);
        const posts = await userService.getUserPosts(currentUser.userId);
        console.log('Fetched posts from backend:', posts);
        
        // Transform backend posts to match UI format
        const transformedPosts = posts.map((post) => ({
          id: post.id, // Use actual ID from backend DTO
          user: {
            name: post.user?.username || currentUser.name || currentUser.email || 'Current User',
            avatar: user?.avatar || 'https://i.pravatar.cc/150?img=1',
            time: formatPostDate(post.uploadDate)
          },
          content: post.description,
          media: post.media ? {
            id: post.media.id,
            type: 'movie', // Default to movie, can be determined from backend if needed
            title: post.media.title,
            thumbnail: post.media.thumbnailUrl,
            videoUrl: post.media.mediaUrl,
            genre: 'N/A',
            rating: 'N/A',
            year: 'N/A',
            duration: 'N/A',
            description: '',
            director: '',
            artist: '',
            cast: [],
            views: '0 views',
            uploadDate: formatPostDate(post.uploadDate)
          } : null,
          likes: post.likesCount || 0,
          comments: post.comments?.length || 0
        }));

        console.log('Transformed posts:', transformedPosts);
        setUserPosts(transformedPosts);
      } catch (err) {
        console.error('Failed to fetch user posts:', err);
        console.error('Error details:', err.response);
        setError(err.message || 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [user]);

  // Helper function to format post date
  const formatPostDate = (dateString) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 30) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      setPasswordLoading(true);
      await authService.changePassword(oldPassword, newPassword);
      
      // Clear form
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Show success notification
      setPasswordSuccess(true);
      
    } catch (err) {
      console.error('Failed to change password:', err);
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div>
            {/* Profile Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 text-center hover:border-white/20 transition-all">
                <div className="text-4xl font-bold text-white mb-2">
                  24
                </div>
                <p className="text-gray-500">Rooms Joined</p>
              </div>
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 text-center hover:border-white/20 transition-all">
                <div className="text-4xl font-bold text-white mb-2">
                  142
                </div>
                <p className="text-gray-500">Hours Streamed</p>
              </div>
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 text-center hover:border-white/20 transition-all">
                <div className="text-4xl font-bold text-white mb-2">
                  68
                </div>
                <p className="text-gray-500">Friends</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold mb-6">Your Shared Posts</h3>
              
              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    <span className="text-gray-400">Loading your posts...</span>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                  <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-400 font-semibold mb-2">Failed to load posts</p>
                  <p className="text-gray-400 text-sm">{error}</p>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && userPosts.length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-gray-400 font-semibold mb-2">No posts yet</p>
                  <p className="text-gray-500 text-sm">Start sharing content to see your posts here</p>
                </div>
              )}

              {/* Posts List */}
              {!loading && !error && userPosts.length > 0 && (
                <div className="space-y-6">{userPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-black/40 rounded-xl border border-green-500/10 overflow-hidden hover:border-green-500/30 transition-all duration-300"
                  >
                    {/* Post Content */}
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <p className="text-gray-400 text-sm">{post.user.time}</p>
                      </div>
                      <p className="text-white text-base mb-4">{post.content}</p>

                      {/* Media Card */}
                      {post.media && (
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
                        className="bg-black/60 rounded-lg overflow-hidden border border-green-500/10 hover:border-green-500/30 transition-all duration-300 cursor-pointer group"
                      >
                        <div className="flex gap-3 p-3">
                          <div className="relative flex-shrink-0">
                            <img
                              src={post.media.thumbnail}
                              alt={post.media.title}
                              className="w-24 h-24 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300 rounded-lg flex items-center justify-center">
                              <div className="bg-green-500/80 group-hover:bg-green-500 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300">
                                {post.media.type === 'movie' ? (
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 18.7l.7-.7L18.6 9l.7-.7-.7-.7-1.4-1.4-.7-.7-.7.7-7.9 7.9-.7.7.7.7 1.4 1.4z" />
                                    <path d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 16.5a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col justify-center">
                            <div className="inline-block mb-1">
                              <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-400 font-semibold">
                                {post.media.type === 'movie' ? '🎬 Movie' : '🎵 Music'}
                              </span>
                            </div>
                            <h4 className="text-white font-bold text-lg mb-1 group-hover:text-green-400 transition-colors">
                              {post.media.title}
                            </h4>
                            {post.media.artist && (
                              <p className="text-gray-300 text-sm mb-1">{post.media.artist}</p>
                            )}
                            <p className="text-gray-400 text-xs">{post.media.genre}</p>
                            {post.media.rating && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-yellow-400 text-sm">★</span>
                                <span className="text-white font-semibold text-sm">{post.media.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-green-500/10">
                        <button className="flex items-center gap-1 text-gray-400 hover:text-green-400 transition-colors text-sm">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span className="font-semibold">{post.likes}</span>
                        </button>
                        <button className="flex items-center gap-1 text-gray-400 hover:text-green-400 transition-colors text-sm">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="font-semibold">{post.comments}</span>
                        </button>
                        <button className="flex items-center gap-1 text-gray-400 hover:text-green-400 transition-colors ml-auto text-sm">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          <span className="font-semibold">Share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div>
            {/* Change Password Section */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 max-w-2xl">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Change Password
              </h3>

              {passwordError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-400 text-sm font-medium">{passwordError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleChangePassword} autoComplete="off" className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => {
                      setOldPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-green-500/50 focus:outline-none transition-colors"
                    placeholder="Enter your current password"
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    disabled={passwordLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-green-500/50 focus:outline-none transition-colors"
                    placeholder="Enter new password (min. 6 characters)"
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    disabled={passwordLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-green-500/50 focus:outline-none transition-colors"
                    placeholder="Confirm your new password"
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    disabled={passwordLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {passwordLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Changing Password...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Change Password</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Success Notification */}
      <SuccessNotification
        message="Profile picture updated successfully!"
        isVisible={uploadSuccess}
        onClose={() => setUploadSuccess(false)}
        duration={3000}
      />

      {/* Password Change Success Notification */}
      <SuccessNotification
        message="Password changed successfully!"
        isVisible={passwordSuccess}
        onClose={() => setPasswordSuccess(false)}
        duration={3000}
      />

      {/* Error Notification */}
      {uploadError && (
        <div className="fixed top-6 right-6 z-50 max-w-md">
          <div className="bg-gradient-to-r from-red-500/90 to-rose-500/90 backdrop-blur-lg border border-red-400/30 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="bg-white/20 rounded-full p-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 pt-0.5">
                <h4 className="text-white font-semibold text-lg mb-1">Upload Failed</h4>
                <p className="text-white/90 text-sm">{uploadError}</p>
              </div>
              <button
                onClick={() => setUploadError(null)}
                className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Profile Header */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              {currentAvatar || user?.avatar ? (
                <img
                  src={currentAvatar || user.avatar}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold text-4xl border-4 border-white/20">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                onClick={handleEditProfileClick}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-white/15 hover:bg-white/20 border border-white/20 p-2 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                )}
              </button>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">{user?.name || 'User'}</h1>
              <p className="text-gray-400 mb-3">{user?.email}</p>
              <div className="flex gap-3">
                <button
                  onClick={handleEditProfileClick}
                  disabled={uploading}
                  className="px-6 py-2 bg-white/15 hover:bg-white/20 border border-white/10 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    'Edit Profile'
                  )}
                </button>
                <button className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium transition-all">
                  Share
                </button>
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 border-t border-white/10 pt-4">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeSection === section.id
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {renderContent()}
    </div>
  );
};

export default Profile;
