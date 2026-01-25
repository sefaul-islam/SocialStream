/**
 * Post Service
 * Handles all post-related operations including creating posts,
 * searching for media, and managing post data.
 */

import axios from 'axios';
import authService from './authService';
import searchService from './searchService';

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
 * Post Service Class
 * Implements post creation and media search functionalities
 */
class PostService {
  /**
   * Create a new post with video media
   * @param {Object} postData - Post data
   * @param {string} postData.description - Post content/description
   * @param {string} postData.mediaType - Type of media (VIDEO)
   * @param {number} mediaId - ID of the video to attach (from backend DTO response)
   * @param {number} userId - ID of the user creating the post
   * @returns {Promise<Object>} Created post data
   * @throws {Error} If mediaId or userId is invalid, or if request fails
   */
  async createVideoPost(postData, mediaId, userId) {
    try {
      // Validate inputs
      if (!mediaId || typeof mediaId !== 'number') {
        throw new Error('Valid video ID is required');
      }
      if (!userId || typeof userId !== 'number') {
        throw new Error('Valid user ID is required');
      }
      if (!postData.description || !postData.description.trim()) {
        throw new Error('Post description is required');
      }
      
      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.post(
        `/newsfeed/createvideoposts?mediaId=${mediaId}&userId=${userId}`,
        postData
      );
      return response.data;
    } catch (error) {
      console.error('Create video post error:', error);
      return this._handlePostError(error);
    }
  }

  /**
   * Create a new post with audio media
   * @param {Object} postData - Post data
   * @param {string} postData.description - Post content/description
   * @param {string} postData.mediaType - Type of media (AUDIO)
   * @param {number} mediaId - ID of the audio to attach (from backend DTO response)
   * @param {number} userId - ID of the user creating the post
   * @returns {Promise<Object>} Created post data
   * @throws {Error} If mediaId or userId is invalid, or if request fails
   */
  async createAudioPost(postData, mediaId, userId) {
    try {
      // Validate inputs
      if (!mediaId || typeof mediaId !== 'number') {
        throw new Error('Valid audio ID is required');
      }
      if (!userId || typeof userId !== 'number') {
        throw new Error('Valid user ID is required');
      }
      if (!postData.description || !postData.description.trim()) {
        throw new Error('Post description is required');
      }
      
      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.post(
        `/newsfeed/createposts?mediaId=${mediaId}&userId=${userId}`,
        postData
      );
      return response.data;
    } catch (error) {
      console.error('Create audio post error:', error);
      return this._handlePostError(error);
    }
  }

  /**
   * Create a new post with media (automatically selects video or audio endpoint)
   * @param {Object} postData - Post data
   * @param {string} postData.description - Post content/description
   * @param {string} postData.mediaType - Type of media (VIDEO or AUDIO)
   * @param {number} mediaId - ID of the media to attach (from backend DTO response)
   * @param {number} userId - ID of the user creating the post
   * @returns {Promise<Object>} Created post data
   * @throws {Error} If mediaId or userId is invalid, or if request fails
   */
  async createPost(postData, mediaId, userId) {
    // Route to the appropriate endpoint based on media type
    if (postData.mediaType === 'AUDIO') {
      return this.createAudioPost(postData, mediaId, userId);
    } else {
      return this.createVideoPost(postData, mediaId, userId);
    }
  }

  /**
   * Internal method to handle post creation errors
   * @private
   */
  _handlePostError(error) {
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
        throw new Error('Media or user not found. Please try again.');
      } else if (status === 400) {
        throw new Error(serverMessage || 'Invalid post data provided.');
      } else if (status === 500) {
        throw new Error('Server error occurred. Please try again later.');
      } else {
        throw new Error(serverMessage || `Request failed with status ${status}`);
      }
    }
    
    throw new Error('Network error. Please check your connection.');
  }

  /**
   * Search for video by title pattern
   * @param {string} title - Video title pattern to search for
   * @returns {Promise<Object>} Video data with thumbnail URL
   */
  async searchVideoByTitle(title) {
    try {
      const videos = await searchService.searchVideosByTitle(title);
      if (!videos || videos.length === 0) {
        throw new Error(`No videos found matching: ${title}`);
      }
      // Return the first matching video
      return videos[0];
    } catch (error) {
      console.error('Search video error:', error);
      throw error;
    }
  }

  /**
   * Search for audio by title pattern
   * @param {string} title - Audio title pattern to search for
   * @returns {Promise<Object>} Audio data with thumbnail URL
   */
  async searchAudioByTitle(title) {
    try {
      // TODO: Use audio-specific search endpoint when available
      // For now, using video search as placeholder
      const results = await searchService.searchVideosByTitle(title);
      if (!results || results.length === 0) {
        throw new Error(`No audio found matching: ${title}`);
      }
      // Return the first matching audio
      return results[0];
    } catch (error) {
      console.error('Search audio error:', error);
      throw error;
    }
  }

  /**
   * Search for media (video or audio) by title
   * @param {string} title - Media title to search for
   * @param {string} mediaType - Type of media ('VIDEO' or 'AUDIO')
   * @returns {Promise<Object>} Media data with thumbnail URL
   */
  async searchMediaByTitle(title, mediaType = 'VIDEO') {
    if (mediaType === 'AUDIO') {
      return this.searchAudioByTitle(title);
    }
    return this.searchVideoByTitle(title);
  }
}

const postService = new PostService();
export default postService;
