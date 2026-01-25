import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/userService';
import authService from '../../services/authService';
import cloudinaryService from '../../services/cloudinaryService';

const Profile = ({ user, onClose }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profilePicture, setProfilePicture] = useState(user?.avatar || null);
  const [userProfile, setUserProfile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'activity', label: 'Activity' },
    { id: 'settings', label: 'Settings' },
    { id: 'privacy', label: 'Privacy' },
  ];

  // Fetch user profile and posts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user profile to get profile picture and user data
        const profile = await userService.getUserProfile();
        setUserProfile(profile);
        if (profile.profilePictureUrl) {
          setProfilePicture(profile.profilePictureUrl);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };

    fetchUserData();
  }, []);

  // Handle profile picture click
  const handleProfilePictureClick = () => {
    if (!uploadingImage) {
      fileInputRef.current?.click();
    }
  };

  // Handle file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadError(null);

    try {
      // 1. Upload to Cloudinary
      console.log('Uploading image to Cloudinary...');
      const cloudinaryResponse = await cloudinaryService.uploadImage(file, 'profile_pictures');
      console.log('Cloudinary response:', cloudinaryResponse);

      // 2. Save URL to backend
      console.log('Saving image URL to backend...');
      await userService.uploadProfilePicture(cloudinaryResponse.url);
      console.log('Profile picture updated successfully');

      // 3. Update local state
      setProfilePicture(cloudinaryResponse.url);

      // Show success message (optional)
      console.log('✅ Profile picture updated successfully!');
    } catch (err) {
      console.error('Failed to upload profile picture:', err);
      setUploadError(err.message || 'Failed to upload image');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setUploadingImage(false);
    }
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
                        {/* User Avatar */}
                        {profilePicture ? (
                          <img
                            src={profilePicture}
                            alt={userProfile?.username || user?.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-green-500/30"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold text-sm border-2 border-green-500/30">
                            {(userProfile?.username || user?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-white font-semibold text-sm">
                            {userProfile?.username || user?.name || 'User'}
                          </p>
                          <p className="text-gray-400 text-xs">{post.user.time}</p>
                        </div>
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
      
      case 'activity':
        return (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h3 className="text-2xl font-bold mb-6">Your Activity</h3>
            <div className="space-y-6">
              {/* Watch History */}
              <div>
                <h4 className="text-lg font-semibold mb-3 text-white">Watch History</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="relative group cursor-pointer">
                      <img
                        src={`https://picsum.photos/300/400?random=${i + 20}`}
                        alt={`Movie ${i}`}
                        className="w-full aspect-[2/3] object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <button className="bg-white/15 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg font-medium">
                          Watch Again
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h3 className="text-2xl font-bold mb-6">Account Settings</h3>
            <div className="space-y-4">
              {[
                { icon: '👤', title: 'Personal Information', desc: 'Update your name and bio' },
                { icon: '✉️', title: 'Email Settings', desc: 'Manage email preferences' },
                { icon: '🔔', title: 'Notifications', desc: 'Configure notifications' },
                { icon: '🎨', title: 'Appearance', desc: 'Customize theme' },
              ].map((setting, i) => (
                <button key={i} className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/5 border border-white/10 hover:border-white/20 transition text-left">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{setting.icon}</span>
                    <div>
                      <h4 className="font-semibold text-white">{setting.title}</h4>
                      <p className="text-sm text-gray-400">{setting.desc}</p>
                    </div>
                  </div>
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        );
      
      case 'privacy':
        return (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h3 className="text-2xl font-bold mb-6">Privacy & Security</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <h4 className="font-semibold text-white mb-1">Profile Visibility</h4>
                  <p className="text-sm text-gray-500">Control who can see your profile</p>
                </div>
                <select className="bg-black/40 border border-white/20 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-white/40">
                  <option>Public</option>
                  <option>Friends Only</option>
                  <option>Private</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <h4 className="font-semibold text-white mb-1">Activity Status</h4>
                  <p className="text-sm text-gray-500">Show when you're online</p>
                </div>
                <button className="bg-white/20 w-14 h-8 rounded-full relative">
                  <div className="absolute right-1 top-1 w-6 h-6 bg-white rounded-full"></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <h4 className="font-semibold text-white mb-1">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-500">Add an extra layer of security</p>
                </div>
                <button className="px-4 py-2 bg-white/15 hover:bg-white/20 border border-white/10 text-white rounded-lg font-medium transition">
                  Enable
                </button>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Profile Header */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Profile Picture */}
              <div 
                onClick={handleProfilePictureClick}
                className={`relative cursor-pointer group ${uploadingImage ? 'pointer-events-none' : ''}`}
              >
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={user?.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white/20 group-hover:border-green-500/50 transition-all"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold text-4xl border-4 border-white/20 group-hover:border-green-500/50 transition-all">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Upload Overlay */}
                <div className={`absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${uploadingImage ? 'opacity-100' : ''}`}>
                  {uploadingImage ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                  ) : (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>

                {/* Edit Icon Button (backup) */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProfilePictureClick();
                  }}
                  className="absolute bottom-0 right-0 bg-green-500 hover:bg-green-600 border border-white/20 p-2 rounded-full transition-all shadow-lg"
                  disabled={uploadingImage}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>

              {/* Upload Error Message */}
              {uploadError && (
                <div className="absolute top-full mt-2 left-0 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-400 whitespace-nowrap z-10">
                  {uploadError}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">{user?.name || 'User'}</h1>
              <p className="text-gray-400 mb-3">{user?.email}</p>
              {uploadingImage && (
                <p className="text-green-400 text-sm mb-3 flex items-center gap-2">
                  <span className="animate-pulse">●</span>
                  Uploading profile picture...
                </p>
              )}
              <div className="flex gap-3">
                <button className="px-6 py-2 bg-white/15 hover:bg-white/20 border border-white/10 rounded-lg font-medium transition-all">
                  Edit Profile
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
