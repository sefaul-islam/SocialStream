import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { socialService } from '../../services';

const JamBuddyReq = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friendSuggestions, setFriendSuggestions] = useState([]);
  const [myFriends, setMyFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingRequest, setSendingRequest] = useState({});
  const [processingRequest, setProcessingRequest] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Fetch friend requests on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      const [requests, suggestions, friends] = await Promise.all([
        socialService.getFriendRequests(),
        socialService.getFriendSuggestions(),
        socialService.getMyFriends()
      ]);
      
      setPendingRequests(requests);
      setFriendSuggestions(suggestions);
      setMyFriends(friends);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleAcceptRequest = async (friendshipId) => {
    try {
      setProcessingRequest(prev => ({ ...prev, [friendshipId]: 'accepting' }));
      await socialService.acceptFriendRequest(friendshipId);
      
      // Refresh all data after accepting
      await fetchAllData();
      showToast('Friend request accepted! 🎉', 'success');
    } catch (err) {
      console.error('Failed to accept friend request:', err);
      showToast(err.message || 'Failed to accept request', 'error');
    } finally {
      setProcessingRequest(prev => ({ ...prev, [friendshipId]: null }));
    }
  };

  const handleRejectRequest = async (friendshipId) => {
    try {
      setProcessingRequest(prev => ({ ...prev, [friendshipId]: 'rejecting' }));
      await socialService.rejectFriendRequest(friendshipId);
      
      // Refresh pending requests after rejecting
      const requests = await socialService.getFriendRequests();
      setPendingRequests(requests);
      showToast('Friend request declined', 'info');
    } catch (err) {
      console.error('Failed to reject friend request:', err);
      showToast(err.message || 'Failed to reject request', 'error');
    } finally {
      setProcessingRequest(prev => ({ ...prev, [friendshipId]: null }));
    }
  };

  const handleSendFriendRequest = async (friendId) => {
    try {
      setSendingRequest(prev => ({ ...prev, [friendId]: true }));
      await socialService.sendFriendRequest(friendId);
      
      // Refresh suggestions after sending request
      const suggestions = await socialService.getFriendSuggestions();
      setFriendSuggestions(suggestions);
      
      showToast('Friend request sent! ✨', 'success');
    } catch (err) {
      console.error('Failed to send friend request:', err);
      showToast(err.message || 'Failed to send friend request', 'error');
    } finally {
      setSendingRequest(prev => ({ ...prev, [friendId]: false }));
    }
  };

  const tabs = [
    { id: 'pending', label: 'Pending', count: pendingRequests.length },
    { id: 'suggestions', label: 'Suggestions', count: friendSuggestions.length },
    { id: 'friends', label: 'My Buddies', count: myFriends.length }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="p-6">
          <h1 className="text-4xl font-bold mb-2 text-white">
            Jam Buddies
          </h1>
          <p className="text-gray-500 mb-6">Connect with friends to watch together</p>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-white/15 text-white border border-white/20'
                    : 'bg-white/5 text-gray-500 hover:bg-white/10 border border-transparent'
                }`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-white/10'
                }`}>
                  {tab.count}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          </div>
        )}

        {activeTab === 'pending' && !loading && (
          <>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-white/5 backdrop-blur-lg rounded-full p-12 mb-6 inline-block border border-white/10">
                  <svg className="w-20 h-20 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No Pending Requests</h3>
                <p className="text-gray-500">You don't have any pending friend requests at the moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingRequests.map((request, index) => (
                  <motion.div
                    key={request.requestSenderId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 backdrop-blur-lg rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-semibold text-xl border-2 border-white/10">
                        {request.requestSenderUsername.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg">{request.requestSenderUsername}</h3>
                        <p className="text-xs text-gray-500">Friend Request</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAcceptRequest(request.friendshipId)}
                        disabled={processingRequest[request.friendshipId]}
                        className="flex-1 px-4 py-2.5 bg-white/15 hover:bg-white/20 border border-white/10 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {processingRequest[request.friendshipId] === 'accepting' ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Accepting...
                          </>
                        ) : (
                          'Accept'
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRejectRequest(request.friendshipId)}
                        disabled={processingRequest[request.friendshipId]}
                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium transition-all text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {processingRequest[request.friendshipId] === 'rejecting' ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-500/30 border-t-gray-400 rounded-full animate-spin"></div>
                          </>
                        ) : (
                          'Decline'
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'suggestions' && (
          <>
            {friendSuggestions.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-white/5 backdrop-blur-lg rounded-full p-12 mb-6 inline-block border border-white/10">
                  <svg className="w-20 h-20 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No Friend Suggestions</h3>
                <p className="text-gray-500">Check back later for friend suggestions</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friendSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.requestSenderId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 backdrop-blur-lg rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-semibold border-2 border-white/10">
                        {suggestion.requestSenderUsername?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-1">{suggestion.requestSenderUsername}</h3>
                        {suggestion.mutualFriends !== undefined && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            {suggestion.mutualFriends} mutual friends
                          </p>
                        )}
                        {suggestion.interests && (
                          <div className="flex flex-wrap gap-1">
                            {suggestion.interests.split(', ').map((interest, i) => (
                              <span key={i} className="px-2 py-1 bg-white/10 rounded-md text-xs text-gray-400">
                                {interest}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSendFriendRequest(suggestion.requestSenderId)}
                      disabled={sendingRequest[suggestion.requestSenderId]}
                      className="w-full px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingRequest[suggestion.requestSenderId] ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                          Send Friend Request
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'friends' && (
          <>
            {myFriends.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-white/5 backdrop-blur-lg rounded-full p-12 mb-6 inline-block border border-white/10">
                  <svg className="w-20 h-20 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Your Jam Buddies</h3>
                <p className="text-gray-500">Your accepted friends will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myFriends.map((friend, index) => (
                  <motion.div
                    key={friend.requestSenderId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 backdrop-blur-lg rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-semibold text-xl border-2 border-white/10">
                        {friend.requestSenderUsername?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg">{friend.requestSenderUsername}</h3>
                        <p className="text-xs text-gray-500">Jam Buddy</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg font-medium transition-all text-sm"
                      >
                        Message
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium transition-all text-gray-400"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div className={`px-6 py-4 rounded-xl backdrop-blur-xl border shadow-2xl flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-300' :
            toast.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-300' :
            'bg-blue-500/20 border-blue-500/30 text-blue-300'
          }`}>
            {toast.type === 'success' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.type === 'info' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default JamBuddyReq;
