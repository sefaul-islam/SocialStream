/**
 * AdminDashboard Component
 * Dashboard page for administrators
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import LogoutConfirmation from '../Components/shared/LogoutConfirmation';
import VideoUploadForm from '../Components/AdminDashboard/VideoUploadForm';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const userInfo = useMemo(() => {
    return authService.getUserInfo();
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-lg border-b border-green-500/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-xs text-gray-400">SocialStream Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{userInfo?.sub || 'Admin'}</p>
              <p className="text-xs text-green-400">Administrator</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors border border-red-500/30"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, {userInfo?.sub?.split('@')[0] || 'Admin'}! 👋
          </h2>
          <p className="text-gray-400">Manage your SocialStream platform from here</p>
        </div>

        {/* Video Upload Section */}
        <div className="mb-8">
          <VideoUploadForm />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Users', value: '1,234', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
            { label: 'Active Sessions', value: '856', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Total Streams', value: '5,678', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Reports', value: '23', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-green-500/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Actions
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Manage Users', description: 'View and manage user accounts' },
                { label: 'Content Moderation', description: 'Review flagged content' },
                { label: 'Analytics', description: 'View platform statistics' },
                { label: 'Settings', description: 'Configure system settings' },
              ].map((action) => (
                <button
                  key={action.label}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left border border-green-500/10 hover:border-green-500/30"
                >
                  <p className="text-white font-medium">{action.label}</p>
                  <p className="text-gray-400 text-sm">{action.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-green-500/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Recent Activity
            </h3>
            <div className="space-y-3">
              {[
                { action: 'New user registered', user: 'john.doe@example.com', time: '5 min ago' },
                { action: 'Content reported', user: 'Stream #1234', time: '15 min ago' },
                { action: 'User banned', user: 'spammer@example.com', time: '1 hour ago' },
                { action: 'Settings updated', user: 'System', time: '2 hours ago' },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="p-3 bg-white/5 rounded-lg border border-green-500/10"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-white text-sm font-medium">{activity.action}</p>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                  <p className="text-gray-400 text-xs">{activity.user}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-green-500/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            System Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'API Server', status: 'Operational', color: 'green' },
              { label: 'Database', status: 'Operational', color: 'green' },
              { label: 'CDN', status: 'Operational', color: 'green' },
            ].map((system) => (
              <div
                key={system.label}
                className="p-4 bg-white/5 rounded-lg border border-green-500/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{system.label}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 bg-${system.color}-500 rounded-full animate-pulse`}></div>
                    <span className={`text-${system.color}-400 text-sm`}>{system.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logout Confirmation */}
      <LogoutConfirmation 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

export default AdminDashboard;
