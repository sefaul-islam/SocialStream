/**
 * Room Service
 * Handles all room-related operations including creating rooms, fetching room data,
 * and managing room interactions.
 */

import axios from 'axios';
import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Create axios instance for room operations
const roomAxios = axios.create({
  baseURL: `${API_BASE_URL}/api/rooms`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach auth token
roomAxios.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
roomAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      authService.logout();
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

/**
 * Room Service Class
 * Provides methods for room management
 */
class RoomService {
  /**
   * Create a new room
   * @param {Object} roomData - Room creation data
   * @param {string} roomData.roomName - Name of the room
   * @returns {Promise<Object>} Created room data
   * Note: userId is extracted from JWT token on backend
   */
  async createRoom(roomData) {
    try {
      const response = await roomAxios.post('/createroom', roomData);
      return response.data;
    } catch (error) {
      console.error('Create room error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create room';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get rooms with optional pagination, sorting, and filtering
   * @param {Object} options - Query options
   * @param {number} options.pagenumber - Page number (default: 1)
   * @param {number} options.pagesize - Number of items per page (default: 5)
   * @param {string} options.sortBy - Field to sort by (default: 'id')
   * @param {string} options.sortDir - Sort direction 'ASC' or 'DESC' (default: 'ASC')
   * @param {string} options.filterBy - Filter criteria (optional)
   * @returns {Promise<Array>} List of rooms
   */
  async getRooms(options = {}) {
    try {
      const {
        pagenumber = 1,
        pagesize = 10,
        sortBy = 'id',
        sortDir = 'ASC',
        filterBy
      } = options;

      const params = {
        pagenumber,
        pagesize,
        sortBy,
        sortDir,
      };

      if (filterBy) {
        params.filterBy = filterBy;
      }

      const response = await roomAxios.get('/getroom', { params });
      return response.data;
    } catch (error) {
      console.error('Get rooms error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch rooms';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get a specific room by ID
   * @param {number} roomId - Room ID
   * @returns {Promise<Object>} Room data
   */
  async getRoomById(roomId) {
    try {
      const response = await roomAxios.get(`/${roomId}`);
      return response.data;
    } catch (error) {
      console.error('Get room by ID error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch room details';
      throw new Error(errorMessage);
    }
  }

  /**
   * Search rooms by query
   * @param {string} query - Search query
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Filtered rooms
   */
  async searchRooms(query, options = {}) {
    try {
      const rooms = await this.getRooms(options);
      
      if (!query) {
        return rooms;
      }

      // Client-side filtering if backend doesn't support search
      return rooms.filter(room =>
        room.roomName?.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Search rooms error:', error);
      throw error;
    }
  }

  /**
   * Get live rooms
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of live rooms
   */
  async getLiveRooms(options = {}) {
    try {
      const rooms = await this.getRooms(options);
      // Filter for active/live rooms based on status
      return rooms.filter(room => room.status === 'ACTIVE' || room.status === 'LIVE');
    } catch (error) {
      console.error('Get live rooms error:', error);
      throw error;
    }
  }

  /**
   * Join a room
   * @param {number} roomId - Room ID to join
   * @param {string} inviteLink - Invite link for the room
   * @returns {Promise<string>} Success message
   */
  async joinRoom(roomId, inviteLink) {
    try {
      const response = await roomAxios.post(
        `/joinroom?roomId=${roomId}`,
        { inviteLink }
      );
      return response.data;
    } catch (error) {
      console.error('Join room error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to join room';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get queue for a room
   * @param {number} roomId - Room ID
   * @returns {Promise<Array>} Queue items ordered by votes
   */
  async getQueue(roomId) {
    try {
      const response = await roomAxios.get(`/${roomId}/queue`);
      return response.data;
    } catch (error) {
      console.error('Get queue error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch queue');
    }
  }

  /**
   * Add video to queue
   * @param {number} roomId - Room ID
   * @param {number} videoId - Video ID to add
   * @returns {Promise<Object>} Created queue item
   */
  async addToQueue(roomId, videoId) {
    try {
      const response = await roomAxios.post(`/${roomId}/queue?videoId=${videoId}`);
      return response.data;
    } catch (error) {
      console.error('Add to queue error:', error);
      throw new Error(error.response?.data?.message || 'Failed to add video to queue');
    }
  }

  /**
   * Remove video from queue (Host/Admin only)
   * @param {number} roomId - Room ID
   * @param {number} queueId - Queue item ID
   * @returns {Promise<Object>} Success message
   */
  async removeFromQueue(roomId, queueId) {
    try {
      const response = await roomAxios.delete(`/${roomId}/queue/${queueId}`);
      return response.data;
    } catch (error) {
      console.error('Remove from queue error:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove from queue');
    }
  }

  /**
   * Toggle vote on queue item
   * @param {number} roomId - Room ID
   * @param {number} queueId - Queue item ID
   * @returns {Promise<Object>} Updated queue item
   */
  async toggleVote(roomId, queueId) {
    try {
      const response = await roomAxios.post(`/${roomId}/queue/${queueId}/vote`);
      return response.data;
    } catch (error) {
      console.error('Toggle vote error:', error);
      throw new Error(error.response?.data?.message || 'Failed to toggle vote');
    }
  }

  /**
   * Check if user has voted on queue item
   * @param {number} roomId - Room ID
   * @param {number} queueId - Queue item ID
   * @returns {Promise<boolean>} Whether user has voted
   */
  async hasVoted(roomId, queueId) {
    try {
      const response = await roomAxios.get(`/${roomId}/queue/${queueId}/voted`);
      return response.data.hasVoted;
    } catch (error) {
      console.error('Check vote error:', error);
      return false;
    }
  }

  /**
   * Get room members
   * @param {number} roomId - Room ID
   * @returns {Promise<Array>} List of room members
   */
  async getRoomMembers(roomId) {
    try {
      const response = await roomAxios.get(`/${roomId}/members`);
      return response.data;
    } catch (error) {
      console.error('Get room members error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch room members');
    }
  }

  /**
   * Check if current user is a member of the room
   * @param {number} roomId - Room ID
   * @returns {Promise<boolean>} Whether user is a member
   */
  async checkMembership(roomId) {
    try {
      const response = await roomAxios.get(`/${roomId}/is-member`);
      return response.data.isMember;
    } catch (error) {
      console.error('Check membership error:', error);
      return false;
    }
  }

  /**
   * Get complete room state (playback + queue with real-time votes)
   * @param {number} roomId - Room ID
   * @returns {Promise<Object>} Room state with playback info and queue
   */
  async getRoomState(roomId) {
    try {
      const response = await roomAxios.get(`/${roomId}/state`);
      return response.data;
    } catch (error) {
      console.error('Get room state error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch room state');
    }
  }

  /**
   * Close room and persist data (Host only)
   * @param {number} roomId - Room ID
   * @returns {Promise<string>} Success message
   */
  async closeRoom(roomId) {
    try {
      const response = await roomAxios.post(`/${roomId}/close`);
      return response.data;
    } catch (error) {
      console.error('Close room error:', error);
      throw new Error(error.response?.data?.message || 'Failed to close room');
    }
  }
}

// Export singleton instance
const roomService = new RoomService();
export default roomService;
