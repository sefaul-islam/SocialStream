import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const MovieRecommendations = ({ title = 'Recommended for You', movies = [] }) => {
  const scrollContainerRef = useRef(null);
  const navigate = useNavigate();

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // If no movies, show empty state
  if (!movies || movies.length === 0) {
    return (
      <div className="px-16 py-12 bg-black">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-8">
          {title}
        </h2>
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No recommendations available at the moment</p>
          <p className="text-gray-500 text-sm mt-2">Watch more videos to get personalized recommendations</p>
        </div>
      </div>
    );
  }

  // Helper function to format duration
  const formatDuration = (seconds) => {
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
    return `${count} views`;
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

      {/* Movie Cards Horizontal Scroll */}
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
                  videoUrl: movie.mediaUrl,
                  thumbnail: movie.thumbnailUrl,
                  description: movie.description,
                  year: movie.year,
                  duration: movie.durationInSeconds ? formatDuration(movie.durationInSeconds) : 'N/A',
                  rating: movie.rating,
                  genre: movie.genre ? [movie.genre] : [],
                  director: movie.director,
                  cast: movie.cast || [],
                  views: movie.viewCount ? formatViews(movie.viewCount) : '0 views',
                  likes: movie.likes || '0',
                  uploadDate: movie.uploadedAt || ''
                }
              }
            })}
            className="group cursor-pointer flex-shrink-0 w-64"
          >
            {/* Thumbnail */}
            <div className="relative overflow-hidden rounded-xl mb-3 border border-green-500/10 group-hover:border-green-500/40 transition-all duration-300">
              <img
                src={movie.thumbnailUrl || 'https://picsum.photos/300/400?random=' + movie.id}
                alt={movie.title}
                className="w-full aspect-[2/3] object-cover group-hover:scale-110 transition-transform duration-500"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 right-4">
                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-400 text-sm">★</span>
                    <span className="text-white font-semibold text-sm">{movie.rating || 'N/A'}</span>
                  </div>
                  
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
                <span>{movie.durationInSeconds ? formatDuration(movie.durationInSeconds) : 'N/A'}</span>
              </div>
              {movie.genre && (
                <div className="inline-block px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400">
                  {movie.genre}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieRecommendations;
