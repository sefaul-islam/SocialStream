import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import roomService from '../../services/roomService';
import authService from '../../services/authService';
import SuccessNotification from '../shared/SuccessNotification';
import RoomInterior from './RoomInterior';

const Room = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [creating, setCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteLinkInput, setInviteLinkInput] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinedRoomId, setJoinedRoomId] = useState(null);

  // Fetch rooms on component mount
  useEffect(() => {
    fetchRooms();
  }, [currentPage]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const roomsData = await roomService.getRooms({
        pagenumber: currentPage,
        pagesize: pageSize,
        sortBy: 'id',
        sortDir: 'DESC'
      });
      setRooms(roomsData);
      
      // Calculate total pages (assuming backend returns all data for requested page)
      // If backend provides total count, use that instead
      if (roomsData.length < pageSize) {
        setTotalPages(currentPage);
      } else {
        // If we got full page, there might be more pages
        setTotalPages(currentPage + 1);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setError(err.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const filters = [
    { id: 'all', label: 'All Rooms', icon: '🏠' },
    { id: 'live', label: 'Live Now', icon: '🔴' },
  ];

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'live') return matchesSearch && (room.status === 'ACTIVE' || room.status === 'LIVE');
    return matchesSearch;
  });

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      alert('Please enter a room name');
      return;
    }

    try {
      setCreating(true);

      const roomData = {
        roomName: newRoomName
      };

      await roomService.createRoom(roomData);
      setNewRoomName('');
      setShowCreateModal(false);
      
      // Refresh rooms list
      await fetchRooms();
      
      // Show success notification
      setSuccessMessage('Room created successfully!');
      setShowSuccess(true);
    } catch (err) {
      console.error('Failed to create room:', err);
      alert(err.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinClick = async (roomId) => {
    setSelectedRoomId(roomId);
    
    try {
      // Check if user is already a member
      const isMember = await roomService.checkMembership(roomId);
      
      if (isMember) {
        // User is already a member (host or previously joined), go directly to room
        setJoinedRoomId(roomId);
        setSelectedRoomId(null);
      } else {
        // User needs to provide invite link
        setShowJoinModal(true);
        setInviteLinkInput('');
      }
    } catch (error) {
      console.error('Failed to check membership:', error);
      // On error, show invite modal to be safe
      setShowJoinModal(true);
      setInviteLinkInput('');
    }
  };

  const handleJoinRoom = async () => {
    if (!inviteLinkInput.trim()) {
      alert('Please enter an invite link');
      return;
    }

    try {
      setJoining(true);
      console.log('Joining room:', selectedRoomId);
      
      // Call the join room API
      const response = await roomService.joinRoom(selectedRoomId, inviteLinkInput);
      
      // Show success notification
      setSuccessMessage(response || 'Successfully joined the room!');
      setShowSuccess(true);
      
      // Close modal and reset
      setShowJoinModal(false);
      setInviteLinkInput('');
      
      // Navigate to room interior
      setJoinedRoomId(selectedRoomId);
      setSelectedRoomId(null);
      
    } catch (err) {
      console.error('Failed to join room:', err);
      alert(err.message || 'Failed to join room');
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveRoom = () => {
    setJoinedRoomId(null);
  };

  // If user has joined a room, show room interior
  if (joinedRoomId) {
    return <RoomInterior roomId={joinedRoomId} onLeave={handleLeaveRoom} />;
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Helper function to get random gradient color
  const getRandomColor = (index) => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-orange-500 to-red-500',
      'from-emerald-500 to-teal-500',
      'from-violet-500 to-purple-500',
      'from-green-500 to-emerald-500',
      'from-indigo-500 to-blue-500',
      'from-pink-500 to-rose-500',
    ];
    return colors[index % colors.length];
  };

  // Helper function to get relative time
  const getRelativeTime = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now - past;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white/20 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading rooms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-4">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 text-lg">{error}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchRooms}
            className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl font-medium transition-all"
          >
            Try Again
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Success Notification */}
      <SuccessNotification
        message={successMessage}
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
        duration={3000}
      />

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Create New Room</h2>
            <input
              type="text"
              placeholder="Enter room name..."
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/20 transition-all text-white placeholder-gray-500 mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
            />
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateRoom}
                disabled={creating}
                className="flex-1 px-4 py-3 bg-white/15 hover:bg-white/20 border border-white/20 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Room'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowCreateModal(false);
                  setNewRoomName('');
                }}
                className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Join Room</h2>
            <p className="text-gray-400 text-sm mb-4">Enter the invite link to join this room</p>
            <input
              type="text"
              placeholder="Enter invite link..."
              value={inviteLinkInput}
              onChange={(e) => setInviteLinkInput(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/20 transition-all text-white placeholder-gray-500 mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
            />
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoinRoom}
                disabled={joining}
                className="flex-1 px-4 py-3 bg-white/15 hover:bg-white/20 border border-white/20 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? 'Joining...' : 'Join Room'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowJoinModal(false);
                  setInviteLinkInput('');
                  setSelectedRoomId(null);
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
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white">
                Your Rooms
              </h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl font-medium transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Room
            </motion.button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl focus:outline-none focus:border-white/20 transition-all text-white placeholder-gray-600"
            />
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {filters.map((filter) => (
              <motion.button
                key={filter.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeFilter === filter.id
                    ? 'bg-white/15 text-white border border-white/20'
                    : 'bg-white/5 text-gray-500 hover:bg-white/10 border border-transparent'
                }`}
              >
                <span>{filter.icon}</span>
                <span>{filter.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="p-6">
        {filteredRooms.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredRooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white/5 backdrop-blur-lg rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Live Badge */}
                {(room.status === 'ACTIVE' || room.status === 'LIVE') && (
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-red-500/90 rounded-full text-[10px] font-semibold">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                    </span>
                    LIVE
                  </div>
                )}

                {/* Thumbnail/Header */}
                <div className={`h-24 bg-gradient-to-br ${getRandomColor(index)} p-4 flex items-end`}>
                  <div className="flex items-center gap-1.5">
                    <div className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full text-[11px] font-medium">
                      {room.status || 'Room'}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-base font-bold text-white mb-1.5 transition-colors truncate">
                    {room.roomName}
                  </h3>

                  {/* Room Stats */}
                  <div className="space-y-1 mb-2.5 pb-2.5 border-b border-white/5">
                    <div className="flex items-center gap-1 text-[11px] text-gray-500">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="truncate">Host: {room.hostName}</span>
                    </div>
                    {room.createdAt && (
                      <div className="flex items-center gap-1 text-[11px] text-gray-500">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="truncate">{getRelativeTime(room.createdAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleJoinClick(room.id)}
                      className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg transition-all duration-300 text-xs font-medium text-white border border-white/10 hover:border-white/20 flex items-center justify-center gap-1"
                    >
                      {room.status === 'ACTIVE' || room.status === 'LIVE' ? 'Join' : 'Enter'}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {/* Previous Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    currentPage === 1
                      ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-white/15 border border-white/10'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </motion.button>

                {/* Page Numbers */}
                <div className="flex gap-2">
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                        ...
                      </span>
                    ) : (
                      <motion.button
                        key={page}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePageClick(page)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          currentPage === page
                            ? 'bg-white/20 text-white border border-white/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                        }`}
                      >
                        {page}
                      </motion.button>
                    )
                  ))}
                </div>

                {/* Next Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    currentPage >= totalPages
                      ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-white/15 border border-white/10'
                  }`}
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            )}
          </>
        ) : (
          // Empty State
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="bg-white/5 backdrop-blur-lg rounded-full p-12 mb-6 border border-white/10">
              <svg className="w-20 h-20 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-white mb-3">No rooms found</h3>
            <p className="text-gray-400 mb-8 text-center max-w-md">
              {searchQuery
                ? `No rooms match "${searchQuery}". Try a different search term or filter.`
                : 'Get started by creating your first room and invite your friends!'}
            </p>
            {!searchQuery && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl font-medium transition-all duration-300 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Room
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Room;
