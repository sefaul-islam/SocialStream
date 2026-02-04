/**
 * Video Service
 * Handles all video-related operations including searching videos,
 * fetching video details, and managing video data.
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
 * Video Service Class
 * Implements video search and retrieval functionalities
 */
class VideoService {
  /**
   * Get video by ID
   * @param {number} id - Video ID
   * @returns {Promise<Object>} Video data
   */
  async getVideoById(id) {
    try {
      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.get(`/api/manual/video/${id}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`Video not found with ID: ${id}`);
      }
      console.error('Get video by ID error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch video';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get video by title
   * @param {string} title - Video title
   * @returns {Promise<Object>} Video data with thumbnail URL
   */
  async getVideoByTitle(title) {
    try {
      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.get(`/api/manual/video/title/${encodeURIComponent(title)}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`Video not found with title: ${title}`);
      }
      console.error('Get video by title error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch video';
      throw new Error(errorMessage);
    }
  }

  /**
   * Create a new video entry
   * @param {Object} videoData - Video data
   * @returns {Promise<Object>} Created video data
   */
  async createVideo(videoData) {
    try {
      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.post('/api/manual/video', videoData);
      return response.data;
    } catch (error) {
      console.error('Create video error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create video';
      throw new Error(errorMessage);
    }
  }

  /**
   * Search videos by keyword (searches in title, description, etc.)
   * @param {string} keyword - Search keyword
   * @returns {Promise<Array>} Array of matching videos
   */
  async searchVideos(keyword) {
    try {
      // For now, use the title endpoint
      // TODO: Implement a proper search endpoint in the backend
      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.get(`/api/manual/video/title/${encodeURIComponent(keyword)}`);
      return [response.data]; // Return as array for consistency
    } catch (error) {
      if (error.response?.status === 404) {
        return []; // Return empty array if not found
      }
      console.error('Search videos error:', error);
      throw new Error('Failed to search videos');
    }
  }
}

const videoService = new VideoService();
export default videoService;
