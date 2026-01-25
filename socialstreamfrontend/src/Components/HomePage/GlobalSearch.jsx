import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { searchService } from '../../services';

const GlobalSearch = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    videos: [],
    rooms: [],
    users: []
  });
  const [isSearching, setIsSearching] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Debounced search with real API call
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ videos: [], rooms: [], users: [] });
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchService.globalSearch(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults({ videos: [], rooms: [], users: [] });
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults({ videos: [], rooms: [], users: [] });
  };

  const handleVideoClick = (video) => {
    onClose(); // Close the search modal
    navigate(`/video/${video.id}`, {
      state: {
        video: {
          id: video.id,
          title: video.title,
          videoUrl: video.mediaUrl,
          thumbnail: video.thumbnailUrl,
          description: video.description,
          year: video.releaseYear,
          duration: video.durationInSeconds ? `${Math.floor(video.durationInSeconds / 60)}m` : 'N/A',
          rating: video.rating || 'N/A',
          genre: video.genre ? video.genre.split(', ') : ['Video'],
          director: video.director,
          cast: video.cast || [],
          views: video.views || video.streamCount || '0 views',
          likes: video.likes || '0',
          uploadDate: video.uploadedAt || 'Recently'
        }
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Search Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-3xl z-50 px-4"
          >
            <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-green-500/30 shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="p-6 border-b border-green-500/20">
                <div className="flex items-center gap-4">
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400"></div>
                  ) : (
                    <svg 
                      className="w-6 h-6 text-green-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  )}
                  
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search for movies, rooms, or users..."
                    autoFocus
                    className="flex-1 bg-transparent text-white text-xl placeholder-gray-400 focus:outline-none"
                  />

                  {searchQuery && (
                    <button
                      onClick={handleClear}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Search Results */}
              <div className="max-h-[60vh] overflow-y-auto p-6 scrollbar-hide">
                {!searchQuery ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400 mb-4">Start typing to search</p>
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                      <span>🎬 Movies</span>
                      <span>🎭 Rooms</span>
                      <span>👤 Users</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Videos */}
                    {searchResults.videos.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-green-400 mb-3 uppercase tracking-wider">Videos</h3>
                        <div className="space-y-2">
                          {searchResults.videos.map((video) => (
                            <div
                              key={video.id}
                              onClick={() => handleVideoClick(video)}
                              className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-green-500/30"
                            >
                              {/* Video Thumbnail */}
                              {video.thumbnailUrl && (
                                <img
                                  src={video.thumbnailUrl}
                                  alt={video.title}
                                  className="w-32 h-20 object-cover rounded-md flex-shrink-0"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              )}
                              
                              {/* Video Info */}
                              <div className="flex-1">
                                <h4 className="text-white font-medium">{video.title}</h4>
                                <p className="text-sm text-gray-400">
                                  {video.releaseYear && `${video.releaseYear} • `}
                                  {video.genre || 'Video'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rooms */}
                    {searchResults.rooms.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-green-400 mb-3 uppercase tracking-wider">Rooms</h3>
                        <div className="space-y-2">
                          {searchResults.rooms.map((room) => (
                            <div
                              key={room.id}
                              className="p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-green-500/30 flex items-center justify-between"
                            >
                              <div>
                                <h4 className="text-white font-medium">{room.name}</h4>
                                <p className="text-sm text-gray-400">{room.members} members</p>
                              </div>
                              {room.live && (
                                <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
                                  LIVE
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Users */}
                    {searchResults.users.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-green-400 mb-3 uppercase tracking-wider">Users</h3>
                        <div className="space-y-2">
                          {searchResults.users.map((user) => (
                            <div
                              key={user.id}
                              className="p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-green-500/30 flex items-center gap-3"
                            >
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold relative">
                                {user.name.charAt(0)}
                                {user.online && (
                                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></span>
                                )}
                              </div>
                              <div>
                                <h4 className="text-white font-medium">{user.name}</h4>
                                <p className="text-sm text-gray-400">{user.online ? 'Online' : 'Offline'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Results */}
                    {!isSearching && searchQuery && searchResults.videos.length === 0 && searchResults.rooms.length === 0 && searchResults.users.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-gray-400">No results found for "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearch;
