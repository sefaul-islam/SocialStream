import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import VideoPlayer from '../Components/HomePage/Video/VideoPlayer';
import { recordVideoLike, removeVideoLike, getTrendingRecommendations } from '../services/recommendationService';
import axios from 'axios';
import authService from '../services/authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const VideoDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  // Get video data from location state or use default
  const defaultVideoData = {
    id: 1,
    title: 'The Matrix Reloaded',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200',
    description: 'In this second adventure, Neo and the rebel leaders estimate that they have 72 hours until Zion falls under siege to the Machine Army. Only a matter of hours separates the last human enclave on Earth from 250,000 Sentinels programmed to destroy mankind.',
    year: 2003,
    duration: '2h 18m',
    rating: 7.2,
    genre: ['Action', 'Sci-Fi', 'Thriller'],
    director: 'The Wachowskis',
    cast: ['Keanu Reeves', 'Laurence Fishburne', 'Carrie-Anne Moss', 'Hugo Weaving'],
    views: '2.4M views',
    likes: '45K',
    uploadDate: '2 weeks ago',
  };

  const videoData = location.state?.video || defaultVideoData;
  const videoId = parseInt(id) || videoData.id;

  // Fetch like/dislike counts and related videos
  useEffect(() => {
    const fetchLikeCounts = async () => {
      try {
        const token = authService.getToken();
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const [likesRes, dislikesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/interactions/video/${videoId}/likes`, { headers }),
          axios.get(`${API_BASE_URL}/api/interactions/video/${videoId}/dislikes`, { headers })
        ]);
        setLikeCount(likesRes.data || 0);
        setDislikeCount(dislikesRes.data || 0);
      } catch (err) {
        console.error('Error fetching like counts:', err);
      }
    };

    const fetchRelatedVideos = async () => {
      try {
        setRelatedLoading(true);
        const response = await getTrendingRecommendations(10);
        const filtered = (response.recommendations || []).filter(v => v.id !== videoId);
        setRelatedVideos(filtered.slice(0, 6));
      } catch (err) {
        console.error('Error fetching related videos:', err);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchLikeCounts();
    fetchRelatedVideos();
    setIsLiked(false);
    setIsDisliked(false);
  }, [videoId]);

  const handleLike = async () => {
    try {
      if (isLiked) {
        await removeVideoLike(videoId);
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        await recordVideoLike(videoId, true);
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        if (isDisliked) {
          setIsDisliked(false);
          setDislikeCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleDislike = async () => {
    try {
      if (isDisliked) {
        await removeVideoLike(videoId);
        setIsDisliked(false);
        setDislikeCount(prev => Math.max(0, prev - 1));
      } else {
        await recordVideoLike(videoId, false);
        setIsDisliked(true);
        setDislikeCount(prev => prev + 1);
        if (isLiked) {
          setIsLiked(false);
          setLikeCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Error toggling dislike:', err);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatViews = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return `${count || 0}`;
  };

  const handleRelatedVideoClick = (video) => {
    navigate(`/video/${video.id}`, {
      state: {
        video: {
          id: video.id,
          title: video.title,
          videoUrl: video.mediaUrl,
          thumbnail: video.thumbnailUrl,
          description: video.description,
          year: video.year,
          duration: video.durationInSeconds ? formatDuration(video.durationInSeconds) : 'N/A',
          rating: video.rating,
          genre: video.genre ? [video.genre] : [],
          director: video.director,
          cast: video.cast || [],
          views: video.viewCount ? `${formatViews(video.viewCount)} views` : '0 views',
          likes: '0',
          uploadDate: video.uploadedAt || ''
        }
      }
    });
  };

  const comments = [
    { id: 1, user: 'John Doe', avatar: 'https://i.pravatar.cc/150?img=1', comment: 'This movie is a masterpiece! The action sequences are mind-blowing.', time: '2 days ago', likes: 234 },
    { id: 2, user: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=2', comment: 'One of the best sci-fi movies ever made. The visual effects still hold up today.', time: '5 days ago', likes: 189 },
    { id: 3, user: 'Mike Johnson', avatar: 'https://i.pravatar.cc/150?img=3', comment: 'The philosophical depth of this film is incredible. Can\'t wait to rewatch it!', time: '1 week ago', likes: 156 },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.button
            onClick={() => navigate('/home')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to Home</span>
          </motion.button>

          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-green-500/30 rounded-lg transition-colors"
            >
              Share
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-medium rounded-lg transition-colors"
            >
              + My List
            </motion.button>
          </div>
        </div>
      </div>

      {/* Video Player Section */}
      <div className="pt-20 px-6">
        <div className="max-w-7xl mx-auto overflow-hidden rounded-xl">
          <VideoPlayer 
            video={videoData} 
            videoUrl={videoData.videoUrl} 
            thumbnail={videoData.thumbnail}
            isHost={true}
            roomId={null}
          />
        </div>
      </div>

      {/* Video Details Section */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Metadata */}
            <div>
              <h1 className="text-4xl font-bold mb-4">{videoData.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full border border-green-500/30">
                  {videoData.rating} ⭐
                </span>
                <span>{videoData.year}</span>
                <span>{videoData.duration}</span>
                <div className="flex gap-2">
                  {videoData.genre.map((g, i) => (
                    <span key={i} className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Engagement Stats with Like/Dislike Buttons */}
            <div className="flex items-center gap-4 text-sm">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  isLiked
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-green-500/30 hover:text-green-400'
                }`}
              >
                <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z M4 22H2V11h2v11z" />
                </svg>
                <span>{likeCount}</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleDislike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  isDisliked
                    ? 'bg-red-500/20 border-red-500/50 text-red-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-red-500/30 hover:text-red-400'
                }`}
              >
                <svg className="w-5 h-5" fill={isDisliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 15V19a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z M20 2h2v11h-2V2z" />
                </svg>
                <span>{dislikeCount}</span>
              </motion.button>

              <div className="flex items-center gap-2 text-gray-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
                <span>{videoData.views}</span>
              </div>
              <span className="text-gray-500">• {videoData.uploadDate}</span>
            </div>

            {/* Tabs */}
            <div className="border-b border-white/10">
              <div className="flex gap-8">
                {['overview', 'cast', 'comments'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-sm font-medium capitalize transition-colors relative ${
                      activeTab === tab ? 'text-green-500' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === 'overview' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Description</h3>
                    <p className="text-gray-400 leading-relaxed">{videoData.description}</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Director</h3>
                    <p className="text-gray-400">{videoData.director}</p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'cast' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <h3 className="text-xl font-semibold mb-4">Cast & Crew</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {videoData.cast.map((actor, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-green-500/30 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500" />
                        <span className="text-sm">{actor}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'comments' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <h3 className="text-xl font-semibold mb-4">{comments.length} Comments</h3>
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-start gap-3">
                          <img src={comment.avatar} alt={comment.user} className="w-10 h-10 rounded-full" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{comment.user}</span>
                              <span className="text-xs text-gray-500">{comment.time}</span>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{comment.comment}</p>
                            <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-500 transition-colors">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                              </svg>
                              {comment.likes}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Sidebar - Related Videos */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Related Videos</h3>
            {relatedLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-500 text-sm">Loading...</p>
              </div>
            ) : relatedVideos.length === 0 ? (
              <p className="text-gray-500 text-sm">No related videos available</p>
            ) : (
              <div className="space-y-4">
                {relatedVideos.map((video) => (
                  <motion.div
                    key={video.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleRelatedVideoClick(video)}
                    className="flex gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
                  >
                    <div className="relative w-40 aspect-video rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={video.thumbnailUrl || `https://picsum.photos/300/200?random=${video.id}`}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      {video.durationInSeconds && (
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-xs rounded">
                          {formatDuration(video.durationInSeconds)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 group-hover:text-green-500 transition-colors">
                        {video.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">{formatViews(video.viewCount)} views</p>
                      {video.rating && (
                        <p className="text-xs text-yellow-400 mt-1">&#9733; {video.rating}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetailsPage;
