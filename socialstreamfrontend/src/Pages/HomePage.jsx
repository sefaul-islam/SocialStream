import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Components/shared/Sidebar';
import SearchBar from "../Components/shared/SearchBar";
import LogoutConfirmation from '../Components/shared/LogoutConfirmation';
import PillNavbar from '../Components/HomePage/PillNavbar';
import ForYou from '../Components/HomePage/ForYou';
import NewsFeed from '../Components/HomePage/NewsFeed';
import Trending from '../Components/HomePage/Trending';
import Discover from '../Components/HomePage/Discover';
import Profile from '../Components/HomePage/Profile';
import JamBuddyReq from '../Components/HomePage/JamBuddyReq';
import GlobalSearch from '../Components/HomePage/GlobalSearch';
import Room from '../Components/HomePage/Room';
import Notification from '../Components/HomePage/Notification';
import authService from '../services/authService';
import userService from '../services/userService';
import assets from '../assets/assets';


const HomePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [pillTab, setPillTab] = useState('forYou');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);

  // Get user info from auth service using useMemo
  const currentUser = useMemo(() => {
    const userInfo = authService.getUserInfo();
    if (userInfo) {
      return {
        name: userInfo.sub?.split('@')[0] || 'User',
        email: userInfo.sub || 'user@socialstream.com',
        online: true,
        avatar: profilePicture, // Add profile picture to user object
      };
    }
    return { name: 'User', email: 'user@socialstream.com', online: true, avatar: profilePicture };
  }, [profilePicture]);

  // Fetch user profile picture on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await userService.getUserProfile();
        if (profile.profilePictureUrl) {
          setProfilePicture(profile.profilePictureUrl);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };

    fetchUserProfile();
  }, []);

  // Refresh profile picture when returning to profile tab
  useEffect(() => {
    if (activeTab === 'profile') {
      const refreshProfile = async () => {
        try {
          const profile = await userService.getUserProfile();
          if (profile.profilePictureUrl) {
            setProfilePicture(profile.profilePictureUrl);
          }
        } catch (err) {
          console.error('Failed to refresh profile:', err);
        }
      };
      refreshProfile();
    }
  }, [activeTab]);

  // Menu items with icons from assets
  const menuItems = [
    {
      id: 'home',
      name: 'Home',
      icon: <img src={assets.homeicon} alt="Home" className="w-6 h-6" />,
      title: 'Home'
    },
    {
      id: 'search',
      name: 'Search',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: 'Search'
    },
    {
      id: 'room',
      name: 'Rooms',
      icon: <img src={assets.createroomicon} alt="Rooms" className="w-6 h-6" />,
      title: 'Rooms'
    },
    {
      id: 'jambuddy',
      name: 'Jam Buddy',
      icon: <img src={assets.frndreq} alt="Jam Buddy" className="w-6 h-6" />,
      title: 'Jam Buddy Requests'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: <img src={assets.notificationicon} alt="Notifications" className="w-6 h-6" />,
      title: 'Notifications',
      badge: '5'
    }
  ];

  const handleItemClick = (item) => {
    if (item.id === 'search') {
      setIsSearchOpen(true);
    } else {
      setActiveTab(item.id);
      console.log('Navigated to:', item.name);
    }
  };

  const handleUserClick = () => {
    setActiveTab('profile');
    console.log('Navigated to: Profile');
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home': {
        const pillTabs = [
          { id: 'forYou', label: 'For You' },
          { id: 'feed', label: 'Feed' },
          { id: 'trending', label: 'Trending' },
          { id: 'discover', label: 'Discover' }
        ];

        return (
          <div className="relative h-full">
            {/* Pill Navbar */}
            <PillNavbar 
              tabs={pillTabs}
              activeTab={pillTab}
              onTabChange={setPillTab}
            />

            {/* Conditional Content based on Pill Tab */}
            {pillTab === 'feed' ? (
              <NewsFeed />
            ) : pillTab === 'trending' ? (
              <Trending />
            ) : pillTab === 'discover' ? (
              <Discover />
            ) : (
              <ForYou />
            )}
          </div>
        );
      }
      
      case 'room':
        return <Room />;
      
      case 'jambuddy':
        return <JamBuddyReq />;
      
      case 'notifications':
        return <Notification />;
      
      case 'profile':
        return <Profile user={currentUser} />;
      
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <Sidebar
        menuItems={menuItems}
        activeItem={activeTab}
        onItemClick={handleItemClick}
        onUserClick={handleUserClick}
        user={currentUser}
        showUserSection={true}
        theme="green"
        onLogout={handleLogout}
      />
      
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        {renderContent()}
      </main>

      {/* Global Search Overlay */}
      <GlobalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />

      {/* Logout Confirmation */}
      <LogoutConfirmation 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

export default HomePage;
