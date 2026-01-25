/**
 * Cloudinary Service
 * Handles image uploads to Cloudinary
 */

// Cloudinary Configuration
// Add these to your .env file:
// VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
// VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

class CloudinaryService {
  /**
   * Upload image to Cloudinary
   * @param {File} file - Image file to upload
   * @param {string} folder - Optional folder name in Cloudinary
   * @returns {Promise<Object>} Upload response with secure_url
   */
  async uploadImage(file, folder = 'profile_pictures') {
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
        throw new Error('Cloudinary credentials not configured. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', folder);
      formData.append('resource_type', 'image');

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary');
      }

      const data = await response.json();
      
      return {
        url: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
        format: data.format,
        resourceType: data.resource_type,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  /**
   * Delete image from Cloudinary
   * Note: This requires signed requests, typically done from backend
   * @param {string} publicId - Public ID of the image to delete
   */
  async deleteImage(publicId) {
    // This should be implemented on the backend for security
    console.warn('Delete operation should be handled by the backend');
    throw new Error('Delete operation must be performed from the backend');
  }

  /**
   * Get optimized image URL with transformations
   * @param {string} url - Original Cloudinary URL
   * @param {Object} options - Transformation options
   * @returns {string} Transformed image URL
   */
  getOptimizedUrl(url, options = {}) {
    const {
      width = 300,
      height = 300,
      crop = 'fill',
      quality = 'auto',
      format = 'auto',
    } = options;

    if (!url || !url.includes('cloudinary.com')) {
      return url;
    }

    // Insert transformation parameters into URL
    const transformation = `w_${width},h_${height},c_${crop},q_${quality},f_${format}`;
    return url.replace('/upload/', `/upload/${transformation}/`);
  }
}

const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
