import React, { useState } from 'react';
import { Upload, Film, Image, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import videoUploadService from '../../services/videoUploadService';

const VideoUploadForm = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [videoProgress, setVideoProgress] = useState(0);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    title: '',
    director: '',
    description: '',
    rating: '',
    cast: '',
    year: new Date().getFullYear().toString(),
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setError('');
    }
  };

  const handleThumbnailFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      setError('');
    }
  };

  const validateForm = () => {
    if (!videoFile) {
      setError('Please select a video file');
      return false;
    }
    if (!thumbnailFile) {
      setError('Please select a thumbnail image');
      return false;
    }
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.director.trim()) {
      setError('Director is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!formData.rating || parseFloat(formData.rating) < 0 || parseFloat(formData.rating) > 10) {
      setError('Rating must be between 0 and 10');
      return false;
    }
    if (!formData.cast.trim()) {
      setError('Cast is required');
      return false;
    }
    if (!formData.year || parseInt(formData.year) < 1900 || parseInt(formData.year) > 2100) {
      setError('Year must be between 1900 and 2100');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setUploading(true);
    setError('');
    setUploadSuccess(false);
    setVideoProgress(0);
    setThumbnailProgress(0);

    try {
      await videoUploadService.uploadComplete(
        {
          videoFile,
          thumbnailFile,
          metadata: formData,
        },
        {
          onVideoProgress: setVideoProgress,
          onThumbnailProgress: setThumbnailProgress,
          onStatusChange: setStatusMessage,
        }
      );

      setUploadSuccess(true);
      setStatusMessage('Video uploaded successfully!');
      
      // Reset form
      setVideoFile(null);
      setThumbnailFile(null);
      setFormData({
        title: '',
        director: '',
        description: '',
        rating: '',
        cast: '',
        year: new Date().getFullYear().toString(),
      });
      
      // Reset file inputs
      document.getElementById('video-input').value = '';
      document.getElementById('thumbnail-input').value = '';
      
    } catch (err) {
      setError(err.message || 'Failed to upload video');
      setStatusMessage('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-green-500/20 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
          <Upload className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Upload Video</h2>
          <p className="text-sm text-gray-400">Upload video content to the platform</p>
        </div>
      </div>

      {/* Success Message */}
      {uploadSuccess && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-green-400 text-sm">Video uploaded and saved successfully!</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Status Message */}
      {statusMessage && uploading && (
        <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg flex items-center gap-3">
          <Loader className="w-5 h-5 text-blue-400 animate-spin" />
          <p className="text-blue-400 text-sm">{statusMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Uploads Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Video File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Video File *
            </label>
            <div className="relative">
              <input
                id="video-input"
                type="file"
                accept="video/*"
                onChange={handleVideoFileChange}
                disabled={uploading}
                className="hidden"
              />
              <label
                htmlFor="video-input"
                className={`flex items-center justify-center gap-2 w-full px-4 py-3 bg-white/5 border-2 border-dashed ${
                  videoFile ? 'border-green-500' : 'border-gray-500'
                } rounded-lg cursor-pointer hover:bg-white/10 transition-colors ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Film className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-300">
                  {videoFile ? videoFile.name : 'Choose video file'}
                </span>
              </label>
              {videoFile && (
                <p className="mt-2 text-xs text-gray-400">
                  Size: {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              )}
              {uploading && videoProgress > 0 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Video: {videoProgress}%</p>
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Thumbnail Image *
            </label>
            <div className="relative">
              <input
                id="thumbnail-input"
                type="file"
                accept="image/*"
                onChange={handleThumbnailFileChange}
                disabled={uploading}
                className="hidden"
              />
              <label
                htmlFor="thumbnail-input"
                className={`flex items-center justify-center gap-2 w-full px-4 py-3 bg-white/5 border-2 border-dashed ${
                  thumbnailFile ? 'border-green-500' : 'border-gray-500'
                } rounded-lg cursor-pointer hover:bg-white/10 transition-colors ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Image className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-300">
                  {thumbnailFile ? thumbnailFile.name : 'Choose thumbnail'}
                </span>
              </label>
              {thumbnailFile && (
                <p className="mt-2 text-xs text-gray-400">
                  Size: {(thumbnailFile.size / 1024).toFixed(2)} KB
                </p>
              )}
              {uploading && thumbnailProgress > 0 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${thumbnailProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Thumbnail: {thumbnailProgress}%</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title and Director */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              disabled={uploading}
              className="w-full px-4 py-3 bg-white/5 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition disabled:opacity-50"
              placeholder="e.g., THUNDERBOLTS*"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Director *
            </label>
            <input
              type="text"
              name="director"
              value={formData.director}
              onChange={handleInputChange}
              disabled={uploading}
              className="w-full px-4 py-3 bg-white/5 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition disabled:opacity-50"
              placeholder="e.g., Jake Schreier"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            disabled={uploading}
            rows="4"
            className="w-full px-4 py-3 bg-white/5 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition disabled:opacity-50 resize-none"
            placeholder="Enter video description..."
          />
        </div>

        {/* Rating, Year, and Cast */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rating * (0-10)
            </label>
            <input
              type="number"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              disabled={uploading}
              min="0"
              max="10"
              step="0.1"
              className="w-full px-4 py-3 bg-white/5 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition disabled:opacity-50"
              placeholder="7.8"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Year *
            </label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              disabled={uploading}
              min="1900"
              max="2100"
              className="w-full px-4 py-3 bg-white/5 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition disabled:opacity-50"
              placeholder="2025"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cast * (comma-separated)
            </label>
            <input
              type="text"
              name="cast"
              value={formData.cast}
              onChange={handleInputChange}
              disabled={uploading}
              className="w-full px-4 py-3 bg-white/5 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition disabled:opacity-50"
              placeholder="Actor 1, Actor 2, Actor 3"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload Video
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default VideoUploadForm;
