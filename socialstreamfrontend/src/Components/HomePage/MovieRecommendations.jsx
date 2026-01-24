import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const MovieRecommendations = ({ title = 'Recommended for You' }) => {
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

  const movies = [
    {
      id: 4,
      thumbnail: 'https://picsum.photos/300/400?random=1',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      title: 'Cosmic Journey',
      year: '2024',
      rating: '8.5',
      duration: '2h 15m',
      genre: 'Sci-Fi',
      description: 'An epic space odyssey following a team of explorers as they venture into the unknown reaches of the cosmos.',
      director: 'Christopher Nolan',
      cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
      views: '4.5M views',
      likes: '287K',
      uploadDate: '1 month ago'
    },
    {
      id: 5,
      thumbnail: 'https://picsum.photos/300/400?random=2',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      title: 'Shadow Realm',
      year: '2025',
      rating: '9.1',
      duration: '1h 58m',
      genre: 'Action',
      description: 'A warrior must navigate through a mysterious shadow dimension to save their world from darkness.',
      director: 'Denis Villeneuve',
      cast: ['Timothée Chalamet', 'Zendaya', 'Oscar Isaac'],
      views: '3.2M views',
      likes: '198K',
      uploadDate: '2 weeks ago'
    },
    {
      id: 6,
      thumbnail: 'https://picsum.photos/300/400?random=3',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      title: 'Ocean Deep',
      year: '2024',
      rating: '7.8',
      duration: '2h 5m',
      genre: 'Drama',
      description: 'A deep dive into the mysteries of the ocean and the human spirit.',
      director: 'James Cameron',
      cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver'],
      views: '2.8M views',
      likes: '145K',
      uploadDate: '3 weeks ago'
    },
    {
      id: 7,
      thumbnail: 'https://picsum.photos/300/400?random=4',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      title: 'Electric Dreams',
      year: '2025',
      rating: '8.9',
      duration: '1h 45m',
      genre: 'Thriller',
      description: 'In a world where dreams can be digitized, one person discovers a dark conspiracy.',
      director: 'Rian Johnson',
      cast: ['Daniel Craig', 'Ana de Armas', 'Chris Evans'],
      views: '5.1M views',
      likes: '312K',
      uploadDate: '1 week ago'
    },
    {
      id: 8,
      thumbnail: 'https://picsum.photos/300/400?random=5',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      title: 'Last Frontier',
      year: '2024',
      rating: '8.2',
      duration: '2h 20m',
      genre: 'Adventure',
      description: 'An expedition to the last unexplored territories on Earth reveals ancient secrets.',
      director: 'Ridley Scott',
      cast: ['Matt Damon', 'Jessica Chastain', 'Kate Mara'],
      views: '3.7M views',
      likes: '223K',
      uploadDate: '2 weeks ago'
    },
    {
      id: 9,
      thumbnail: 'https://picsum.photos/300/400?random=6',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      title: 'Neon Nights',
      year: '2025',
      rating: '7.6',
      duration: '1h 52m',
      genre: 'Romance',
      description: 'A love story set against the vibrant backdrop of a neon-lit metropolis.',
      director: 'Greta Gerwig',
      cast: ['Saoirse Ronan', 'Timothée Chalamet', 'Laura Dern'],
      views: '2.1M views',
      likes: '167K',
      uploadDate: '4 days ago'
    }
  ];

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
                  videoUrl: movie.videoUrl,
                  thumbnail: movie.thumbnail,
                  description: movie.description,
                  year: movie.year,
                  duration: movie.duration,
                  rating: parseFloat(movie.rating),
                  genre: [movie.genre],
                  director: movie.director,
                  cast: movie.cast,
                  views: movie.views,
                  likes: movie.likes,
                  uploadDate: movie.uploadDate
                }
              }
            })}
            className="group cursor-pointer flex-shrink-0 w-64"
          >
            {/* Thumbnail */}
            <div className="relative overflow-hidden rounded-xl mb-3 border border-green-500/10 group-hover:border-green-500/40 transition-all duration-300">
              <img
                src={movie.thumbnail}
                alt={movie.title}
                className="w-full aspect-[2/3] object-cover group-hover:scale-110 transition-transform duration-500"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 right-4">
                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-400 text-sm">★</span>
                    <span className="text-white font-semibold text-sm">{movie.rating}</span>
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
                <span>{movie.year}</span>
                <span>•</span>
                <span>{movie.duration}</span>
              </div>
              <div className="inline-block px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400">
                {movie.genre}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieRecommendations;
