import React from 'react';
import VideoHero from './VideoHero';
import MovieRecommendations from './MovieRecommendations';

const ForYou = () => {
  return (
    <>
      {/* Video Hero Component */}
      <VideoHero />

      {/* Movie Recommendations */}
      <MovieRecommendations title="Recommended for You" />
    </>
  );
};

export default ForYou;
