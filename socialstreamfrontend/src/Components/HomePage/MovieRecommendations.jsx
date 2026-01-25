import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recommendationService } from '../../services/recommendationService';

const MovieRecommendations = ({ title = 'Recommended for You', useTrending = false }) => {
  const scrollContainerRef = useRef(null);
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = useTrending 
          ? await recommendationService.getTrendingRecommendations(30)
          : await recommendationService.getForYouRecommendations(20);
        
        setMovies(data);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [useTrending]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="px-16 py-12 bg-black">
      {/* Section Title */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          {title}
        </h2>
        
        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => scroll('left')}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-green-500/20 hover:border-green-500/40 transition-all"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-green-500/20 hover:border-green-500/40 transition-all"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-20">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && movies.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No recommendations available yet</p>
          <p className="text-gray-500 text-sm mt-2">Start watching videos to get personalized recommendations</p>
        </div>
      )}

      {/* Movie Cards Horizontal Scroll */}
      {!loading && !error && movies.length > 0 && (
        <div 
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth"
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              onClick={() => navigate(`/video/${movie.id}`, {
                state: {
                  video: {
                    id: movie.id,
                    title: movie.title,
                    videoUrl: movie.mediaUrl || movie.s3Url || movie.mediaurl,
                    thumbnail: movie.thumbnailUrl || movie.thumbnailurl,
                    description: movie.description,
                    year: movie.year,
                    duration: movie.durationInSeconds || movie.duration,
                    rating: movie.rating,
                    genre: [movie.director || 'General'], // Using director as genre temporarily
                    director: movie.director,
                    cast: Array.isArray(movie.cast) ? movie.cast : [],
                    views: `${movie.views || movie.viewCount || 0} views`,
                    likes: '0',
                    uploadDate: new Date(movie.uploadedAt).toLocaleDateString()
                  }
                }
              })}
              className="group cursor-pointer flex-shrink-0 w-64"
            >
              {/* Thumbnail */}
              <div className="relative overflow-hidden rounded-xl mb-3 border border-green-500/10 group-hover:border-green-500/40 transition-all duration-300">
                <img
                  src={movie.thumbnailUrl || movie.thumbnailurl || 'https://via.placeholder.com/300x400?text=No+Image'}
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4">
                    {/* Rating */}
                    {movie.rating && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-yellow-400 text-sm">★</span>
                        <span className="text-white font-semibold text-sm">{movie.rating}</span>
                      </div>
                    )}
                    
                    {/* Play Button */}
                    <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-300">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span className="text-sm font-semibold">Play</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Movie Info */}
              <div className="space-y-1">
                <h3 className="text-white font-semibold text-sm group-hover:text-green-400 transition-colors line-clamp-1">
                  {movie.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{movie.year || 'N/A'}</span>
                  <span>•</span>
                  <span>{Math.floor(movie.duration / 60)}m</span>
                </div>
                <div className="inline-block px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400">
                  {movie.director || 'Video'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MovieRecommendations;
