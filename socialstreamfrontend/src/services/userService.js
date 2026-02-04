/**
 * User Service
 * Handles all user-related operations including fetching user posts,
 * user profile data, and user-specific information.
 */

import axios from 'axios';
import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Create axios instance with authentication
 */
const createAuthAxios = () => {
  const token = authService.getToken();
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
  });
};

/**
 * User Service Class
 * Implements user profile and post retrieval functionalities
 */
class UserService {
  /**
   * Get all posts for a specific user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of user's posts
   * @throws {Error} If userId is invalid or request fails
   */
  async getUserPosts(userId) {
    try {
      // Validate input
      if (!userId || typeof userId !== 'number') {
        throw new Error('Valid user ID is required');
      }

      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.get(`/api/users/${userId}/posts`);
      return response.data;
    } catch (error) {
      console.error('Get user posts error:', error);
      
      // Handle specific error cases
      if (error.message && !error.response) {
        // Validation errors thrown above
        throw error;
      }
      
      if (error.response) {
        const status = error.response.status;
        const serverMessage = error.response.data?.message;
        
        if (status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (status === 404) {
          throw new Error('User not found or has no posts.');
        } else if (status === 403) {
          throw new Error('Access denied. You cannot view this user\'s posts.');
        } else if (status === 500) {
          throw new Error('Server error occurred. Please try again later.');
        } else {
          throw new Error(serverMessage || `Request failed with status ${status}`);
        }
      }
      
      throw new Error('Network error. Please check your connection.');
    }
  }

  /**
   * Get current user's posts
   * @returns {Promise<Array>} Array of current user's posts
   */
  async getCurrentUserPosts() {
    try {
      const userInfo = authService.getUserInfo();
      if (!userInfo || !userInfo.userId) {
        throw new Error('User not authenticated');
      }
      return this.getUserPosts(userInfo.userId);
    } catch (error) {
      console.error('Get current user posts error:', error);
      throw error;
    }
  }

  /**
   * Upload user profile picture
   * @param {string} imageUrl - Cloudinary image URL
   * @returns {Promise<Object>} Updated user profile
   */
  async uploadProfilePicture(imageUrl) {
    try {
      if (!imageUrl) {
        throw new Error('Image URL is required');
      }

      const userInfo = authService.getUserInfo();
      if (!userInfo || !userInfo.userId) {
        throw new Error('User not authenticated');
      }

      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.post('/api/users/profile-picture', {
        profilePictureUrl: imageUrl
      });

      return response.data;
    } catch (error) {
      console.error('Upload profile picture error:', error);
      
      if (error.message && !error.response) {
        throw error;
      }
      
      if (error.response) {
        const status = error.response.status;
        const serverMessage = error.response.data?.message;
        
        if (status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (status === 400) {
          throw new Error(serverMessage || 'Invalid image URL provided.');
        } else if (status === 500) {
          throw new Error('Server error occurred. Please try again later.');
        } else {
          throw new Error(serverMessage || `Request failed with status ${status}`);
        }
      }
      
      throw new Error('Network error. Please check your connection.');
    }
  }

  /**
   * Get user profile information
   * @returns {Promise<Object>} User profile data
   */
  async getUserProfile() {
    try {
      const userInfo = authService.getUserInfo();
      if (!userInfo || !userInfo.userId) {
        throw new Error('User not authenticated');
      }

      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.get('/api/users/profile');
      return response.data;
    } catch (error) {
      console.error('Get user profile error:', error);
      
      if (error.response) {
        const status = error.response.status;
        const serverMessage = error.response.data?.message;
        
        if (status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (status === 404) {
          throw new Error('User profile not found.');
        } else {
          throw new Error(serverMessage || `Request failed with status ${status}`);
        }
      }
      
      throw new Error('Network error. Please check your connection.');
    }
  }
}

const userService = new UserService();
export default userService;
