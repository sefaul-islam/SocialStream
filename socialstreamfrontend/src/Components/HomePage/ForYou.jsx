import React, { useEffect, useState } from 'react';
import VideoHero from './VideoHero';
import MovieRecommendations from './MovieRecommendations';
import { getForYouRecommendations } from '../../services/recommendationService';

const ForYou = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await getForYouRecommendations(20);
        setRecommendations(response.recommendations || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
        setError('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <>
      {/* Video Hero Component */}
      <VideoHero />

      {/* Movie Recommendations */}
      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-400">Loading recommendations...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-400">{error}</p>
        </div>
      ) : (
        <MovieRecommendations 
          title="Recommended for You" 
          movies={recommendations}
        />
      )}
    </>
  );
};

export default ForYou;
