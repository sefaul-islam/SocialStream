import axios from 'axios';
import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Get personalized "For You" recommendations
 * @param {number} limit - Number of recommendations to fetch (default: 20)
 * @param {string} algorithm - Algorithm to use: 'hybrid', 'content_based', 'collaborative', 'trending'
 * @returns {Promise<Array>} Array of recommended videos
 */
export const getForYouRecommendations = async (limit = 20, algorithm = 'hybrid') => {
  try {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.get(
      `${API_BASE_URL}/api/recommendations/for-you`,
      {
        params: { limit, algorithm },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching For You recommendations:', error);
    
    // Return empty array on error to prevent UI crashes
    if (error.response?.status === 401) {
      // Token expired - redirect to login
      authService.logout();
      window.location.href = '/auth';
    }
    
    return [];
  }
};

/**
 * Get trending videos
 * @param {number} limit - Number of trending videos to fetch (default: 30)
 * @returns {Promise<Array>} Array of trending videos
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

    return response.data;
  } catch (error) {
    console.error('Error fetching trending recommendations:', error);
    return [];
  }
};

/**
 * Group videos by category for trending display
 * @param {Array} videos - Array of video objects
 * @returns {Object} Videos grouped by category
 */
export const groupVideosByCategory = (videos) => {
  const grouped = {
    Action: [],
    Comedy: [],
    Drama: [],
    'Sci-Fi': [],
    Horror: [],
    Other: []
  };

  videos.forEach(video => {
    // Use director field as temporary category until category field is added
    const category = video.director || 'Other';
    
    if (grouped[category]) {
      grouped[category].push(video);
    } else {
      grouped.Other.push(video);
    }
  });

  return grouped;
};

export const recommendationService = {
  getForYouRecommendations,
  getTrendingRecommendations,
  groupVideosByCategory
};
