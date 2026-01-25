import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recommendationService } from '../../services/recommendationService';

const Trending = () => {
  const navigate = useNavigate();
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await recommendationService.getTrendingRecommendations(30);
        setTrendingVideos(data);
      } catch (err) {
        console.error('Error fetching trending videos:', err);
        setError('Failed to load trending videos');
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  // Group videos by director field (temporary category)
  const groupedVideos = trendingVideos.reduce((acc, video) => {
    const category = video.director || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(video);
    return acc;
  }, {});

  // Fallback genres if no videos
  const genres = Object.keys(groupedVideos).length > 0 
    ? Object.keys(groupedVideos) 
    : ['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror'];

  if (loading) {
    return (
      <div className="pt-20 px-8">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-20 px-8">
        <div className="text-center py-20">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 px-8">
      {/* Trending by Genre */}
      {genres.map((genre) => {
        const videos = groupedVideos[genre] || [];
        
        if (videos.length === 0) return null;

        return (
          <div key={genre} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-green-400">Trending in {genre}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {videos.slice(0, 5).map((video) => (
                <div 
                  key={video.id}
                  onClick={() => navigate(`/video/${video.id}`, {
                    state: {
                      video: {
                        id: video.id,
                        title: video.title,
                        videoUrl: video.mediaUrl || video.s3Url || video.mediaurl,
                        thumbnail: video.thumbnailUrl || video.thumbnailurl,
                        description: video.description,
                        year: video.year,
                        duration: video.durationInSeconds || video.duration,
                        rating: video.rating,
                        genre: [video.director || 'General'],
                        director: video.director,
                        cast: Array.isArray(video.cast) ? video.cast : [],
                        views: `${video.views || video.viewCount || 0} views`,
                        likes: '0',
                        uploadDate: new Date(video.uploadedAt).toLocaleDateString()
                      }
                    }
                  })}
                  className="group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-xl aspect-[2/3] bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 hover:border-green-400/60 transition-all duration-300">
                    <img
                      src={video.thumbnailUrl || video.thumbnailurl || 'https://via.placeholder.com/300x400?text=No+Image'}
                      alt={video.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <button className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transform scale-90 group-hover:scale-100 transition-transform">
                        Watch Now
                      </button>
                    </div>
                  </div>
                  <h3 className="mt-3 text-white font-medium group-hover:text-green-400 transition-colors line-clamp-2">
                    {video.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {video.year || 'N/A'} • {Math.floor(video.duration / 60)}m
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      
      {/* Empty State */}
      {trendingVideos.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No trending videos available yet</p>
          <p className="text-gray-500 text-sm mt-2">Check back later for trending content</p>
        </div>
      )}
    </div>
  );
};

export default Trending;
