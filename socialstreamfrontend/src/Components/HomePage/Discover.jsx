import React from 'react';
import SearchBar from '../shared/SearchBar';

const Discover = () => {
  return (
    <div className="pt-20 px-8">
      <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
        Discover
      </h1>
      <SearchBar 
        placeholder="Search movies, rooms, or users..." 
        className="mb-6"
        onSearch={(query) => console.log('Discover search:', query)}
      />
      <p className="text-gray-400 mb-8">Find new rooms, content, and friends to watch with</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Recent Activity Card */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition">
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
          <p className="text-gray-400">Your recent streaming sessions and interactions</p>
        </div>
        
        {/* Active Rooms Card */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition">
          <h3 className="text-xl font-semibold mb-4">Active Rooms</h3>
          <p className="text-gray-400">3 rooms are currently streaming</p>
        </div>
        
        {/* Friends Online Card */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition">
          <h3 className="text-xl font-semibold mb-4">Friends Online</h3>
          <p className="text-gray-400">8 friends are currently online</p>
        </div>

        {/* Popular Content Card */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition">
          <h3 className="text-xl font-semibold mb-4">Popular Content</h3>
          <p className="text-gray-400">Most watched this week</p>
        </div>
      </div>

      {/* Discover Categories */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-green-400">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance'].map((category) => (
            <div
              key={category}
              className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 hover:from-green-500/30 hover:to-emerald-600/30 rounded-xl p-6 border border-green-500/30 hover:border-green-400/60 transition-all cursor-pointer text-center"
            >
              <p className="text-white font-semibold">{category}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Discover;
