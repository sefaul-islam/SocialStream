/**
 * Authentication Service
 * Handles all authentication-related operations including login, registration,
 * token management, and user session handling.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Token storage keys
const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'user_info';

// Create axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

/**
 * Authentication Service Class
 * Implements secure token management and authentication flows
 */
class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.Username - User's username
   * @param {string} userData.Email - User's email
   * @param {string} userData.Password - User's password
   * @returns {Promise<Object>} User data and token
   */
  async register(userData) {
    try {
      const response = await axiosInstance.post('/public/api/v1/register', userData);
      const userDto = response.data;
      
      // After successful registration, automatically log in the user
      const loginResponse = await this.login({
        email: userData.Email,
        password: userData.Password,
      });

      return {
        user: userDto,
        ...loginResponse,
      };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  }

  /**
   * Authenticate user with credentials
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User's email
   * @param {string} credentials.password - User's password
   * @returns {Promise<Object>} Authentication token and user data
   */
  async login(credentials) {
    try {
      const response = await axiosInstance.post('/login', credentials, {
        transformResponse: [(data) => data], // Get raw response as text
      });

      const token = response.data;
      
      // Store token securely
      this.setToken(token);
      
      // Decode and store user information from JWT
      const decoded = this.decodeToken(token);
      const userInfo = {
        ...decoded,
        roles: decoded.roles || [],
        email: decoded.sub,
        userId: decoded.id
      };
      this.setUserInfo(userInfo);

      return {
        token,
        user: userInfo,
      };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Invalid credentials';
      throw new Error(errorMessage);
    }
  }

  /**
   * Log out the current user
   * Clears all authentication data from storage
   */
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  /**
   * Get the stored authentication token
   * @returns {string|null} JWT token or null if not found
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  }

  /**
   * Store authentication token
   * @param {string} token - JWT token to store
   * @param {boolean} rememberMe - Whether to use persistent storage
   */
  setToken(token, rememberMe = true) {
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  }

  /**
   * Get stored user information
   * @returns {Object|null} User information or null
   */
  getUserInfo() {
    const userJson = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Get user roles from token
   * @returns {Array<string>} Array of user roles
   */
  getUserRoles() {
    const token = this.getToken();
    if (!token) return [];
    
    const decoded = this.decodeToken(token);
    return decoded?.roles || [];
  }

  /**
   * Store user information
   * @param {Object} userInfo - User information to store
   */
  setUserInfo(userInfo) {
    const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
    storage.setItem(USER_KEY, JSON.stringify(userInfo));
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    
    // Check if token is expired
    return !this.isTokenExpired(token);
  }

  /**
   * Decode JWT token to extract user information
   * @param {string} token - JWT token to decode
   * @returns {Object} Decoded token payload
   */
  decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token to check
   * @returns {boolean} True if token is expired
   */
  isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get authorization header for API requests
   * @returns {Object} Authorization header object
   */
  getAuthHeader() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Make authenticated API request using axios
   * @param {string} url - API endpoint URL
   * @param {Object} options - Axios options
   * @returns {Promise<Object>} Axios response
   */
  async authenticatedRequest(url, options = {}) {
    const token = this.getToken();
    
    if (!token || this.isTokenExpired(token)) {
      this.logout();
      throw new Error('Authentication required');
    }

    try {
      const response = await axiosInstance({
        url,
        ...options,
        headers: {
          ...options.headers,
          ...this.getAuthHeader(),
        },
      });

      return response;
    } catch (error) {
      // Handle unauthorized responses
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.logout();
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  }

  /**
   * Refresh user information from the server
   * @returns {Promise<Object>} Updated user information
   */
  async refreshUserInfo() {
    try {
      const response = await this.authenticatedRequest('/api/user/me', {
        method: 'GET',
      });
      
      const userInfo = response.data;
      this.setUserInfo(userInfo);
      return userInfo;
    } catch (error) {
      console.error('Refresh user info error:', error);
      throw new Error('Failed to refresh user info');
    }
  }

  /**
   * Change user password
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Response from server
   */
  async changePassword(oldPassword, newPassword) {
    try {
      const response = await this.authenticatedRequest('/api/user/change-password', {
        method: 'POST',
        data: { oldPassword, newPassword },
      });

      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw new Error('Failed to change password');
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
