/**
 * NewsFeed Service
 * Handles all newsfeed-related operations including fetching posts,
 * managing likes, comments, and post interactions.
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
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
  });
};

/**
 * NewsFeed Service Class
 * Implements newsfeed fetching and interaction functionalities
 */
class NewsFeedService {
  /**
   * Get all posts for the newsfeed
   * @returns {Promise<Array>} Array of posts
   */
  async getPosts() {
    try {
      const axiosInstance = createAuthAxios();
      // TODO: Replace with actual endpoint when backend implements it
      const response = await axiosInstance.get('/newsfeed/posts');
      return response.data;
    } catch (error) {
      console.error('Get posts error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch posts';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get posts for a specific user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of user's posts
   */
  async getUserPosts(userId) {
    try {
      const axiosInstance = createAuthAxios();
      // TODO: Replace with actual endpoint when backend implements it
      const response = await axiosInstance.get(`/newsfeed/user/${userId}/posts`);
      return response.data;
    } catch (error) {
      console.error('Get user posts error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch user posts';
      throw new Error(errorMessage);
    }
  }

  /**
   * Like or unlike a post
   * @param {number} postId - Post ID
   * @returns {Promise<Object>} Updated post data
   */
  async toggleLike(postId) {
    try {
      const axiosInstance = createAuthAxios();
      // TODO: Replace with actual endpoint when backend implements it
      const response = await axiosInstance.post(`/newsfeed/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      console.error('Toggle like error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to toggle like';
      throw new Error(errorMessage);
    }
  }

  /**
   * Add a comment to a post
   * @param {number} postId - Post ID
   * @param {string} content - Comment content
   * @returns {Promise<Object>} Created comment data
   */
  async addComment(postId, content) {
    try {
      const axiosInstance = createAuthAxios();
      // TODO: Replace with actual endpoint when backend implements it
      const response = await axiosInstance.post(`/newsfeed/posts/${postId}/comments`, {
        content
      });
      return response.data;
    } catch (error) {
      console.error('Add comment error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add comment';
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete a post
   * @param {number} postId - Post ID
   * @returns {Promise<void>}
   */
  async deletePost(postId) {
    try {
      const axiosInstance = createAuthAxios();
      // TODO: Replace with actual endpoint when backend implements it
      await axiosInstance.delete(`/newsfeed/posts/${postId}`);
    } catch (error) {
      console.error('Delete post error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete post';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get posts from user's friends
   * Fetches posts created by users with accepted friendship status
   * @returns {Promise<Array>} Array of friends' posts ordered by upload date
   */
  async getFriendsPosts() {
    try {
      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.get('/newsfeed/friends-posts');
      return response.data;
    } catch (error) {
      console.error('Get friends posts error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch friends posts';
      throw new Error(errorMessage);
    }
  }
}

const newsfeedService = new NewsFeedService();
export default newsfeedService;
