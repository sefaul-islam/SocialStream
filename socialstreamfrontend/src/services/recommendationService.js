import axios from 'axios';
import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Get personalized "For You" recommendations
 * @param {number} limit - Number of recommendations to fetch (default: 20)
 * @returns {Promise<Object>} Recommendation response with videos array
 */
export const getForYouRecommendations = async (limit = 20) => {
  try {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.get(
      `${API_BASE_URL}/api/recommendations/for-you`,
      {
        params: { limit },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Response format: { recommendations: [...], algorithm: "...", totalResults: N }
    return response.data;
  } catch (error) {
    console.error('Error fetching For You recommendations:', error);
    
    // Return empty result on error
    if (error.response?.status === 401) {
      authService.logout();
      window.location.href = '/auth';
    }
    
    return { recommendations: [], algorithm: 'error', totalResults: 0 };
  }
};

/**
 * Get trending videos
 * @param {number} limit - Number of trending videos to fetch (default: 30)
 * @returns {Promise<Object>} Recommendation response with videos array
 */
export const getTrendingRecommendations = async (limit = 30) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/recommendations/trending`,
      {
        params: { limit },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Response format: { recommendations: [...], algorithm: "...", totalResults: N }
    return response.data;
  } catch (error) {
    console.error('Error fetching trending recommendations:', error);
    return { recommendations: [], algorithm: 'error', totalResults: 0 };
  }
};

/**
 * Record a video view interaction
 * @param {number} videoId - ID of the video
 * @param {number} watchDuration - How long user watched (seconds)
 * @param {number} watchPercentage - Percentage watched (0-100)
 * @returns {Promise<Object>} Response from API
 */
export const recordVideoView = async (videoId, watchDuration, watchPercentage) => {
  try {
    const token = authService.getToken();
    if (!token) return;

    const response = await axios.post(
      `${API_BASE_URL}/api/interactions/view`,
      { videoId, watchDuration, watchPercentage },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error recording video view:', error);
    return null;
  }
};

/**
 * Record a video like/dislike
 * @param {number} videoId - ID of the video
 * @param {boolean} isLiked - true for like, false for dislike
 * @returns {Promise<Object>} Response from API
 */
export const recordVideoLike = async (videoId, isLiked) => {
  try {
    const token = authService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.post(
      `${API_BASE_URL}/api/interactions/like`,
      { videoId, isLiked },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error recording video like:', error);
    throw error;
  }
};

/**
 * Remove a video like/dislike
 * @param {number} videoId - ID of the video
 * @returns {Promise<Object>} Response from API
 */
export const removeVideoLike = async (videoId) => {
  try {
    const token = authService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await axios.delete(
      `${API_BASE_URL}/api/interactions/like/${videoId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error removing video like:', error);
    throw error;
  }
};

/**
 * Record a search query
 * @param {string} query - Search query text
 * @returns {Promise<Object>} Response from API
 */
export const recordSearch = async (query) => {
  try {
    const token = authService.getToken();
    if (!token) return;

    const response = await axios.post(
      `${API_BASE_URL}/api/interactions/search`,
      { query },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error recording search:', error);
    return null;
  }
};

export const recommendationService = {
  getForYouRecommendations,
  getTrendingRecommendations,
  recordVideoView,
  recordVideoLike,
  removeVideoLike,
  recordSearch
};
