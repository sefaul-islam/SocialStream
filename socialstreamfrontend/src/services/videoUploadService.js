/**
 * Video Upload Service
 * Handles video and thumbnail uploads to Cloudinary and saving metadata to backend
 */

import axios from 'axios';
import authService from './authService';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

class VideoUploadService {
  /**
   * Upload video file to Cloudinary
   * @param {File} file - Video file to upload
   * @param {Function} onProgress - Progress callback (percent)
   * @returns {Promise<Object>} Upload response with URL and duration
   */
  async uploadVideo(file, onProgress = null) {
    try {
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      // Validate file type
      const validTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only MP4, MPEG, MOV, AVI, and WebM are allowed.');
      }

      // Validate file size (max 100MB for videos)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 100MB limit');
      }

      // Check if Cloudinary credentials are configured
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        throw new Error('Cloudinary credentials not configured');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'videos');
      formData.append('resource_type', 'video');

      // Upload to Cloudinary with progress tracking
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(percent);
            }
          },
        }
      );

      const data = response.data;
      
      return {
        url: data.secure_url,
        publicId: data.public_id,
        duration: data.duration || 0, // Duration in seconds
        width: data.width,
        height: data.height,
        format: data.format,
        resourceType: data.resource_type,
      };
    } catch (error) {
      console.error('Video upload error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to upload video');
    }
  }

  /**
   * Upload thumbnail/image to Cloudinary
   * @param {File} file - Image file to upload
   * @param {Function} onProgress - Progress callback (percent)
   * @returns {Promise<Object>} Upload response with URL
   */
  async uploadThumbnail(file, onProgress = null) {
    try {
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit');
      }

      // Check if Cloudinary credentials are configured
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        throw new Error('Cloudinary credentials not configured');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'thumbnails');
      formData.append('resource_type', 'image');

      // Upload to Cloudinary
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(percent);
            }
          },
        }
      );

      const data = response.data;
      
      return {
        url: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
        format: data.format,
      };
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to upload thumbnail');
    }
  }

  /**
   * Save video metadata to backend
   * @param {Object} videoData - Video metadata
   * @returns {Promise<Object>} Response from backend
   */
  async saveVideoMetadata(videoData) {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/manual/video`,
        videoData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Save video metadata error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to save video metadata');
    }
  }

  /**
   * Complete video upload flow: upload video, thumbnail, and save metadata
   * @param {Object} uploadData - Complete upload data
   * @param {File} uploadData.videoFile - Video file
   * @param {File} uploadData.thumbnailFile - Thumbnail file
   * @param {Object} uploadData.metadata - Video metadata
   * @param {Object} callbacks - Progress callbacks
   * @returns {Promise<Object>} Complete upload response
   */
  async uploadComplete(uploadData, callbacks = {}) {
    const { videoFile, thumbnailFile, metadata } = uploadData;
    const { onVideoProgress, onThumbnailProgress, onStatusChange } = callbacks;

    try {
      // Step 1: Upload video
      if (onStatusChange) onStatusChange('Uploading video...');
      const videoResult = await this.uploadVideo(videoFile, onVideoProgress);

      // Step 2: Upload thumbnail
      if (onStatusChange) onStatusChange('Uploading thumbnail...');
      const thumbnailResult = await this.uploadThumbnail(thumbnailFile, onThumbnailProgress);

      // Step 3: Prepare video data for backend
      const videoData = {
        mediaUrl: videoResult.url,
        thumbnailUrl: thumbnailResult.url,
        durationInSeconds: Math.round(videoResult.duration),
        title: metadata.title,
        director: metadata.director,
        description: metadata.description,
        rating: parseFloat(metadata.rating),
        cast: metadata.cast,
        year: metadata.year,
      };

      // Step 4: Save to backend
      if (onStatusChange) onStatusChange('Saving to database...');
      const backendResponse = await this.saveVideoMetadata(videoData);

      if (onStatusChange) onStatusChange('Upload complete!');

      return {
        success: true,
        video: videoResult,
        thumbnail: thumbnailResult,
        backend: backendResponse,
        data: videoData,
      };
    } catch (error) {
      if (onStatusChange) onStatusChange(`Error: ${error.message}`);
      throw error;
    }
  }
}

// Export singleton instance
const videoUploadService = new VideoUploadService();
export default videoUploadService;
