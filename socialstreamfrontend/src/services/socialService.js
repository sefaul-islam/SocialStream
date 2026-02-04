/**
 * Social Service
 * Handles all social-related operations including friend requests
 * and friend management.
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
 * Social Service Class
 * Implements friend request and social functionalities
 */
class SocialService {
  /**
   * Get all pending friend requests for the current user
   * @returns {Promise<Array>} Array of friend requests
   * @throws {Error} If request fails
   */
  async getFriendRequests() {
    try {
      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.get('/api/social/friend-requests');
      return response.data;
    } catch (error) {
      console.error('Get friend requests error:', error);
      
      // Handle specific error cases
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorized. Please login again.');
          case 404:
            throw new Error('Friend requests endpoint not found');
          default:
            throw new Error(error.response.data.message || 'Failed to fetch friend requests');
        }
      }
      throw new Error('Network error. Please check your connection.');
    }
  }

  /**
   * Send a friend request to another user
   * @param {number} friendId - ID of the user to send request to
   * @returns {Promise<string>} Success message
   * @throws {Error} If friendId is invalid or request fails
   */
  async sendFriendRequest(friendId) {
    try {
      // Validate input
      if (!friendId || typeof friendId !== 'number') {
        throw new Error('Valid friend ID is required');
      }

      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.post(`/api/social/send-friend-request?friendId=${friendId}`);
      return response.data;
    } catch (error) {
      console.error('Send friend request error:', error);
      
      // Handle specific error cases
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorized. Please login again.');
          case 400:
            throw new Error('Invalid request. User may already be a friend.');
          case 404:
            throw new Error('User not found');
          default:
            throw new Error(error.response.data.message || 'Failed to send friend request');
        }
      }
      throw new Error('Network error. Please check your connection.');
    }
  }

  /**
   * Get friend suggestions for the current user
   * @returns {Promise<Array>} Array of friend suggestions
   * @throws {Error} If request fails
   */
  async getFriendSuggestions() {
    try {
      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.get('/api/social/friendsuggestions');
      return response.data;
    } catch (error) {
      console.error('Get friend suggestions error:', error);
      
      // Handle specific error cases
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorized. Please login again.');
          case 404:
            throw new Error('Friend suggestions endpoint not found');
          default:
            throw new Error(error.response.data.message || 'Failed to fetch friend suggestions');
        }
      }
      throw new Error('Network error. Please check your connection.');
    }
  }

  /**
   * Get all friends of the current user
   * @returns {Promise<Array>} Array of friends
   * @throws {Error} If request fails
   */
  async getMyFriends() {
    try {
      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.get('/api/social/my-friends');
      return response.data;
    } catch (error) {
      console.error('Get my friends error:', error);
      
      // Handle specific error cases
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorized. Please login again.');
          case 404:
            throw new Error('Friends endpoint not found');
          default:
            throw new Error(error.response.data.message || 'Failed to fetch friends');
        }
      }
      throw new Error('Network error. Please check your connection.');
    }
  }

  /**
   * Accept a friend request
   * @param {number} friendshipId - ID of the friendship to accept
   * @returns {Promise<string>} Success message
   * @throws {Error} If friendshipId is invalid or request fails
   */
  async acceptFriendRequest(friendshipId) {
    try {
      if (!friendshipId || typeof friendshipId !== 'number') {
        throw new Error('Valid friendship ID is required');
      }

      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.post(`/api/social/accept-friend-request?friendshipId=${friendshipId}`);
      return response.data;
    } catch (error) {
      console.error('Accept friend request error:', error);
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorized. Please login again.');
          case 404:
            throw new Error('Friend request not found');
          default:
            throw new Error(error.response.data.message || 'Failed to accept friend request');
        }
      }
      throw new Error('Network error. Please check your connection.');
    }
  }

  /**
   * Reject a friend request
   * @param {number} friendshipId - ID of the friendship to reject
   * @returns {Promise<string>} Success message
   * @throws {Error} If friendshipId is invalid or request fails
   */
  async rejectFriendRequest(friendshipId) {
    try {
      if (!friendshipId || typeof friendshipId !== 'number') {
        throw new Error('Valid friendship ID is required');
      }

      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.post(`/api/social/reject-friend-request?friendshipId=${friendshipId}`);
      return response.data;
    } catch (error) {
      console.error('Reject friend request error:', error);
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorized. Please login again.');
          case 404:
            throw new Error('Friend request not found');
          default:
            throw new Error(error.response.data.message || 'Failed to reject friend request');
        }
      }
      throw new Error('Network error. Please check your connection.');
    }
  }
}

export default new SocialService();
