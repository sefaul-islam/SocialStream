import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Notification = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  // Sample notification data
  const notifications = [
    {
      id: 1,
      type: 'invite',
      icon: '👥',
      title: 'Room Invitation',
      message: 'Sarah invited you to "Movie Marathon"',
      time: '2 minutes ago',
      isRead: false,
      color: 'from-purple-500 to-pink-500',
      action: 'Join Room'
    },
    {
      id: 2,
      type: 'message',
      icon: '💬',
      title: 'New Message',
      message: 'New message in "Gaming Stream"',
      time: '15 minutes ago',
      isRead: false,
      color: 'from-blue-500 to-cyan-500',
      action: 'View Message'
    },
    {
      id: 3,
      type: 'friend',
      icon: '🤝',
      title: 'Friend Requests',
      message: '3 new friend requests',
      time: '1 hour ago',
      isRead: false,
      color: 'from-green-500 to-emerald-500',
      action: 'View Requests'
    },
    {
      id: 4,
      type: 'room',
      icon: '🎉',
      title: 'Room Activity',
      message: 'Your room "Music Lounge" has 10 new members',
      time: '3 hours ago',
      isRead: true,
      color: 'from-orange-500 to-red-500',
      action: 'View Room'
    },
    {
      id: 5,
      type: 'live',
      icon: '🔴',
      title: 'Live Stream',
      message: 'Live stream starting in 5 minutes',
      time: '4 hours ago',
      isRead: true,
      color: 'from-red-500 to-pink-500',
      action: 'Watch Now'
    },
    {
      id: 6,
      type: 'update',
      icon: '⭐',
      title: 'New Feature',
      message: 'Check out the new room filters!',
      time: '1 day ago',
      isRead: true,
      color: 'from-yellow-500 to-orange-500',
      action: 'Learn More'
    },
    {
      id: 7,
      type: 'message',
      icon: '💬',
      title: 'New Comment',
      message: 'Mike commented on your stream',
      time: '2 days ago',
      isRead: true,
      color: 'from-blue-500 to-cyan-500',
      action: 'View Comment'
    }
  ];

  const filters = [
    { id: 'all', label: 'All', icon: '📬' },
    { id: 'unread', label: 'Unread', icon: '🔔' },
    { id: 'invite', label: 'Invites', icon: '👥' },
    { id: 'message', label: 'Messages', icon: '💬' },
    { id: 'live', label: 'Live', icon: '🔴' }
  ];

  const filteredNotifications = notifications.filter(notification => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !notification.isRead;
    return notification.type === activeFilter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id) => {
    console.log('Mark as read:', id);
  };

  const handleMarkAllAsRead = () => {
    console.log('Mark all as read');
  };

  const handleNotificationAction = (notification) => {
    console.log('Action clicked:', notification.action);
  };

  const handleDeleteNotification = (id) => {
    console.log('Delete notification:', id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header Section */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-white">
                Notifications
              </h1>
              <p className="text-gray-500">
                {unreadCount > 0 ? (
                  <span>
                    <span className="text-white font-medium">{unreadCount}</span> unread notification{unreadCount !== 1 ? 's' : ''}
                  </span>
                ) : (
                  'You\'re all caught up!'
                )}
              </p>
            </div>
            {unreadCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMarkAllAsRead}
                className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl font-medium transition-all duration-300 text-white flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mark All as Read
              </motion.button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {filters.map((filter) => {
              const count = filter.id === 'all' 
                ? notifications.length 
                : filter.id === 'unread'
                ? unreadCount
                : notifications.filter(n => n.type === filter.id).length;

              return (
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
                  {count > 0 && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      activeFilter === filter.id
                        ? 'bg-white/20'
                        : 'bg-white/10 text-gray-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="p-6">
        {filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative bg-white/5 backdrop-blur-lg rounded-xl p-5 border transition-all duration-300 hover:scale-[1.01] ${
                  notification.isRead
                    ? 'border-white/10 hover:border-white/20'
                    : 'border-white/20 hover:border-white/30 bg-white/5'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${notification.color} flex items-center justify-center text-2xl shadow-lg`}>
                    {notification.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-white">
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <div className="flex-shrink-0 w-2 h-2 bg-white rounded-full mt-1.5"></div>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {notification.time}
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.isRead && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <svg className="w-4 h-4 text-gray-500 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4 text-gray-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  {notification.action && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleNotificationAction(notification)}
                      className="flex-shrink-0 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg transition-all duration-300 text-white border border-white/10 hover:border-white/20 text-sm font-medium"
                    >
                      {notification.action}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          // Empty State
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="bg-white/5 backdrop-blur-lg rounded-full p-12 mb-6 border border-white/10">
              <svg className="w-20 h-20 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-white mb-3">
              {activeFilter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </h3>
            <p className="text-gray-400 text-center max-w-md">
              {activeFilter === 'unread'
                ? 'You\'re all caught up! Check back later for new updates.'
                : activeFilter === 'all'
                ? 'When you receive notifications, they\'ll appear here.'
                : `No ${activeFilter} notifications at the moment.`}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Notification;
