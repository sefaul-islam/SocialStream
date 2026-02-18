import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrendingRecommendations } from '../../services/recommendationService';

const Trending = () => {
  const navigate = useNavigate();
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrendingVideos = async () => {
      try {
        setLoading(true);
        const response = await getTrendingRecommendations(50);
        setTrendingVideos(response.recommendations || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching trending videos:', err);
        setError('Failed to load trending videos');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingVideos();
  }, []);

  // Helper function to format duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Helper function to format view count
  const formatViews = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count || 0} views`;
  };

  // Group videos by genre
  const groupByGenre = (videos) => {
    const grouped = {};
    videos.forEach(video => {
      const genre = video.genre || 'Other';
      if (!grouped[genre]) {
        grouped[genre] = [];
      }
      grouped[genre].push(video);
    });
    return grouped;
  };

  const handleVideoClick = (video) => {
    navigate(`/video/${video.id}`, {
      state: {
        video: {
          id: video.id,
          title: video.title,
          videoUrl: video.mediaUrl,
          thumbnail: video.thumbnailUrl,
          description: video.description,
          year: video.year,
          duration: formatDuration(video.durationInSeconds),
          rating: video.rating,
          genre: video.genre ? [video.genre] : [],
          director: video.director,
          cast: video.cast || [],
          views: formatViews(video.viewCount),
          likes: video.likes || '0',
          uploadDate: video.uploadedAt || ''
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="pt-20 px-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading trending videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-20 px-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (trendingVideos.length === 0) {
    return (
      <div className="pt-20 px-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-400 text-lg">No trending videos available</p>
        </div>
      </div>
    );
  }

  const videosByGenre = groupByGenre(trendingVideos);

  return (
    <div className="pt-20 px-8 pb-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
          Trending Now
        </h1>
        <p className="text-gray-400">
          {trendingVideos.length} trending videos across all genres
        </p>
      </div>

      {/* All Trending Videos */}
      {Object.keys(videosByGenre).length === 0 ? (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-green-400">All Videos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {trendingVideos.map((video) => (
              <div 
                key={video.id}
                onClick={() => handleVideoClick(video)}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-xl aspect-[2/3] border border-green-500/30 hover:border-green-400/60 transition-all duration-300">
                  <img
                    src={video.thumbnailUrl || `https://picsum.photos/300/400?random=${video.id}`}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Rating Badge */}
                  {video.rating && (
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-white text-xs font-semibold">{video.rating}</span>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transform scale-90 group-hover:scale-100 transition-transform">
                      Watch Now
                    </button>
                  </div>
                </div>
                <h3 className="mt-3 text-white font-medium group-hover:text-green-400 transition-colors line-clamp-1">
                  {video.title}
                </h3>
                <p className="text-gray-400 text-sm">
                  {video.year} • {formatDuration(video.durationInSeconds)}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {formatViews(video.viewCount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Trending by Genre */
        Object.entries(videosByGenre).map(([genre, videos]) => (
          <div key={genre} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-green-400">
              Trending in {genre}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {videos.map((video) => (
                <div 
                  key={video.id}
                  onClick={() => handleVideoClick(video)}
                  className="group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-xl aspect-[2/3] border border-green-500/30 hover:border-green-400/60 transition-all duration-300">
                    <img
                      src={video.thumbnailUrl || `https://picsum.photos/300/400?random=${video.id}`}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Rating Badge */}
                    {video.rating && (
                      <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-white text-xs font-semibold">{video.rating}</span>
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <button className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transform scale-90 group-hover:scale-100 transition-transform">
                        Watch Now
                      </button>
                    </div>
                  </div>
                  <h3 className="mt-3 text-white font-medium group-hover:text-green-400 transition-colors line-clamp-1">
                    {video.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {video.year} • {formatDuration(video.durationInSeconds)}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {formatViews(video.viewCount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Trending;
