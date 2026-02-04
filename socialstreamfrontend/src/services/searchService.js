/**
 * Search Service
 * Handles all search-related operations including video search,
 * pattern-based search, and advanced search functionality.
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
 * Search Service Class
 * Implements search functionalities for videos, rooms, and users
 */
class SearchService {
  /**
   * Search videos by title pattern (case-insensitive, contains match)
   * @param {string} title - Title pattern to search for
   * @returns {Promise<Array>} Array of matching videos
   */
  async searchVideosByTitle(title) {
    try {
      if (!title || !title.trim()) {
        return [];
      }

      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.get('/api/search/videos', {
        params: { title: title.trim() }
      });
      return response.data;
    } catch (error) {
      console.error('Search videos by title error:', error);
      
      if (error.response?.status === 404) {
        return [];
      }
      
      throw new Error('Failed to search videos');
    }
  }

  /**
   * Advanced video search using custom patterns
   * @param {string} pattern - Search pattern
   * @returns {Promise<Array>} Array of matching videos
   */
  async advancedVideoSearch(pattern) {
    try {
      if (!pattern || !pattern.trim()) {
        return [];
      }

      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.get('/api/search/videos/advanced', {
        params: { pattern: pattern.trim() }
      });
      return response.data;
    } catch (error) {
      console.error('Advanced video search error:', error);
      
      if (error.response?.status === 404) {
        return [];
      }
      
      throw new Error('Failed to search videos');
    }
  }

  /**
   * Search for exact title match
   * @param {string} title - Exact title to search for
   * @returns {Promise<Object|null>} Video object or null if not found
   */
  async searchVideoByExactTitle(title) {
    try {
      if (!title || !title.trim()) {
        return null;
      }

      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.get('/api/search/videos/exact', {
        params: { title: title.trim() }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Search video by exact title error:', error);
      throw new Error('Failed to search video');
    }
  }

  /**
   * Global search across multiple entities (videos, rooms, users)
   * @param {string} query - Search query
   * @returns {Promise<Object>} Object containing search results for different categories
   */
  async globalSearch(query) {
    try {
      if (!query || !query.trim()) {
        return { videos: [], rooms: [], users: [] };
      }

      // For now, only search videos. Can be extended to include rooms and users
      const videos = await this.searchVideosByTitle(query);
      
      return {
        videos: videos || [],
        rooms: [], // TODO: Implement room search when backend endpoint is available
        users: []  // TODO: Implement user search when backend endpoint is available
      };
    } catch (error) {
      console.error('Global search error:', error);
      return { videos: [], rooms: [], users: [] };
    }
  }
}

const searchService = new SearchService();
export default searchService;
