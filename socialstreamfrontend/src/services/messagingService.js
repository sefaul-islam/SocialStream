/**
 * Messaging Service
 * Handles all direct messaging operations including sending messages,
 * fetching conversations, and managing reactions.
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
 * Messaging Service Class
 * Implements direct messaging functionalities
 */
class MessagingService {
  /**
   * Send a message to a friend
   * @param {number} recipientId - ID of the recipient
   * @param {string} content - Message content
   * @returns {Promise<Object>} Sent message data
   * @throws {Error} If request fails
   */
  async sendMessage(recipientId, content) {
    try {
      // Validate and convert input
      const numericRecipientId = Number(recipientId);
      if (!recipientId || isNaN(numericRecipientId)) {
        throw new Error('Valid recipient ID is required');
      }
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new Error('Message content cannot be empty');
      }
      if (content.length > 1000) {
        throw new Error('Message content cannot exceed 1000 characters');
      }

      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.post('/api/messages/send', {
        recipientId: numericRecipientId,
        content: content.trim()
      });
      return response.data;
    } catch (error) {
      console.error('Send message error:', error);
      
      // Handle specific error cases
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorized. Please login again.');
          case 400:
            throw new Error(error.response.data.message || 'You can only send messages to friends');
          case 404:
            throw new Error('Recipient not found');
          default:
            throw new Error(error.response.data.message || 'Failed to send message');
        }
      }
      throw error;
    }
  }

  /**
   * Get conversation history with a friend
   * @param {number} friendId - ID of the friend
   * @param {number} page - Page number (default: 0)
   * @param {number} size - Page size (default: 20)
   * @returns {Promise<Object>} Paginated message history
   * @throws {Error} If request fails
   */
  async getConversation(friendId, page = 0, size = 20) {
    try {
      // Validate and convert input
      const numericFriendId = Number(friendId);
      if (!friendId || isNaN(numericFriendId)) {
        throw new Error('Valid friend ID is required');
      }

      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.get(`/api/messages/conversation/${numericFriendId}`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error('Get conversation error:', error);
      
      // Handle specific error cases
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorized. Please login again.');
          case 404:
            throw new Error('User not found');
          default:
            throw new Error(error.response.data.message || 'Failed to fetch conversation');
        }
      }
      throw new Error('Network error. Please check your connection.');
    }
  }

  /**
   * Add or update a reaction to a message
   * @param {number} messageId - ID of the message
   * @param {string} reaction - Reaction type (LIKE, LOVE, HAHA, WOW, SAD)
   * @returns {Promise<Object>} Updated message data
   * @throws {Error} If request fails
   */
  async addReaction(messageId, reaction) {
    try {
      // Validate and convert input
      const numericMessageId = Number(messageId);
      if (!messageId || isNaN(numericMessageId)) {
        throw new Error('Valid message ID is required');
      }
      if (!reaction || typeof reaction !== 'string') {
        throw new Error('Valid reaction is required');
      }

      const validReactions = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD'];
      if (!validReactions.includes(reaction.toUpperCase())) {
        throw new Error('Invalid reaction type');
      }

      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.post(`/api/messages/react/${numericMessageId}`, null, {
        params: { reaction: reaction.toUpperCase() }
      });
      return response.data;
    } catch (error) {
      console.error('Add reaction error:', error);
      
      // Handle specific error cases
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorized. Please login again.');
          case 400:
            throw new Error(error.response.data.message || 'You can only react to messages you\'re part of');
          case 404:
            throw new Error('Message not found');
          default:
            throw new Error(error.response.data.message || 'Failed to add reaction');
        }
      }
      throw new Error('Network error. Please check your connection.');
    }
  }

  /**
   * Get all conversations for the current user
   * @returns {Promise<Array>} Array of conversation summaries
   * @throws {Error} If request fails
   */
  async getConversations() {
    try {
      const axiosInstance = createAuthAxios();
      const response = await axiosInstance.get('/api/messages/conversations');
      return response.data;
    } catch (error) {
      console.error('Get conversations error:', error);
      
      // Handle specific error cases
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorized. Please login again.');
          default:
            throw new Error(error.response.data.message || 'Failed to fetch conversations');
        }
      }
      throw new Error('Network error. Please check your connection.');
    }
  }
}

// Export singleton instance
export default new MessagingService();
