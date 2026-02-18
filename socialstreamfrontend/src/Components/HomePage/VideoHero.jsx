import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getTrendingRecommendations } from '../../services/recommendationService';

const fallbackVideos = [
  {
    id: 1,
    url: "https://res.cloudinary.com/dbo1k1yon/video/upload/v1767470525/Marvel_Studios_Thunderbolts____Big_Game_Trailer___In_Theaters_May_2_zma0hb.mp4",
    badge: 'New Movie',
    title: 'THUNDERBOLTS*',
    rating: 8.5,
    year: '2025',
    duration: '2h 8m',
    genre: 'Action and Adventure, Super Heroes',
    description: 'A group of supervillains are recruited by the government to carry out dangerous missions in exchange for clemency.',
    director: 'Jake Schreier',
    cast: ['Sebastian Stan', 'Florence Pugh', 'David Harbour', 'Wyatt Russell'],
    views: '1.2M views',
    likes: '98K',
    uploadDate: '1 week ago'
  },
  {
    id: 2,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    badge: 'Featured',
    title: 'ELEPHANTS DREAM',
    rating: 7.8,
    year: '2024',
    duration: '1h 45m',
    genre: 'Animation, Fantasy',
    description: 'Two strange characters wander through a surreal world of organic and mechanical devices.',
    director: 'Bassam Kurdali',
    cast: ['Tygo Gernandt', 'Cas Jiskoot'],
    views: '856K views',
    likes: '67K',
    uploadDate: '3 days ago'
  },
  {
    id: 3,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    badge: 'Trending',
    title: 'FOR BIGGER BLAZES',
    rating: 8.0,
    year: '2025',
    duration: '2h 15m',
    genre: 'Drama, Adventure',
    description: 'An epic journey through fire and courage as heroes rise to face unprecedented challenges.',
    director: 'Michael Bay',
    cast: ['Chris Evans', 'Zendaya', 'John Boyega'],
    views: '2.1M views',
    likes: '156K',
    uploadDate: '5 days ago'
  }
];

const formatDuration = (seconds) => {
  if (!seconds) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const formatViews = (count) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`;
  return `${count || 0} views`;
};

const VideoHero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videos, setVideos] = useState(fallbackVideos);
  const navigate = useNavigate();

  // Fetch trending videos for the hero section
  useEffect(() => {
    const fetchHeroVideos = async () => {
      try {
        const response = await getTrendingRecommendations(3);
        const recs = response.recommendations || [];
        if (recs.length > 0) {
          const mapped = recs.map((rec, index) => ({
            id: rec.id,
            url: rec.mediaUrl || '',
            badge: index === 0 ? 'Top Pick' : index === 1 ? 'Featured' : 'Trending',
            title: rec.title || 'Untitled',
            rating: rec.rating ? parseFloat(rec.rating) : null,
            year: rec.year || '',
            duration: rec.durationInSeconds ? formatDuration(rec.durationInSeconds) : 'N/A',
            genre: rec.genre || '',
            description: rec.description || '',
            director: rec.director || '',
            cast: rec.cast || [],
            views: rec.viewCount ? formatViews(rec.viewCount) : '0 views',
            likes: '0',
            uploadDate: rec.uploadedAt || '',
            thumbnailUrl: rec.thumbnailUrl
          }));
          setVideos(mapped);
        }
      } catch (err) {
        console.error('Error fetching hero videos:', err);
      }
    };

    fetchHeroVideos();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % videos.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [videos.length]);

  const currentVideo = videos[currentIndex];

  return (
    <div className="relative w-full h-[85vh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {currentVideo.url ? (
            <video
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              key={currentVideo.url}
            >
              <source src={currentVideo.url} type="video/mp4" />
            </video>
          ) : currentVideo.thumbnailUrl ? (
            <img
              src={currentVideo.thumbnailUrl}
              alt={currentVideo.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black" />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

          {/* Hero Content - Bottom Left */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="absolute bottom-16 left-16 max-w-2xl"
          >
            {/* Badge */}
            <div className="inline-block bg-white px-4 py-1.5 rounded-md mb-4">
              <span className="text-black font-semibold text-sm">{currentVideo.badge}</span>
            </div>

            {/* Title */}
            <h1 className="text-7xl font-black text-white mb-4 tracking-tight">
              {currentVideo.title}
            </h1>

            {/* Metadata */}
            <div className="flex items-center gap-3 text-gray-300 text-sm mb-6">
              {currentVideo.rating && (
                <>
                  <span className="px-2 py-0.5 border border-gray-400 rounded text-xs font-semibold">
                    {currentVideo.rating} &#9733;
                  </span>
                  <span>•</span>
                </>
              )}
              <span>{currentVideo.year}</span>
              <span>•</span>
              <span>{currentVideo.duration}</span>
              {currentVideo.genre && (
                <>
                  <span>•</span>
                  <span>{currentVideo.genre}</span>
                </>
              )}
            </div>

            {/* Play Button */}
            <button
              onClick={() => navigate(`/video/${currentVideo.id}`, {
                state: {
                  video: {
                    id: currentVideo.id,
                    title: currentVideo.title,
                    videoUrl: currentVideo.url,
                    thumbnail: currentVideo.thumbnailUrl || currentVideo.url,
                    description: currentVideo.description,
                    year: currentVideo.year,
                    duration: currentVideo.duration,
                    rating: currentVideo.rating || 0,
                    genre: currentVideo.genre ? currentVideo.genre.split(', ') : [],
                    director: currentVideo.director,
                    cast: currentVideo.cast,
                    views: currentVideo.views,
                    likes: currentVideo.likes,
                    uploadDate: currentVideo.uploadDate
                  }
                }
              })}
              className="bg-white hover:bg-gray-200 text-black font-bold text-lg px-12 py-4 rounded-lg flex items-center gap-3 transition-all duration-300 hover:scale-105"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              PLAY
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Progress Indicators */}
      <div className="absolute bottom-6 right-16 flex gap-2">
        {videos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className="group"
          >
            <div className={`h-1 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-12 bg-green-500'
                : 'w-8 bg-gray-500 group-hover:bg-gray-400'
            }`} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default VideoHero;
