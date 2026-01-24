import React from 'react';

const Trending = () => {
  return (
    <div className="pt-20 px-8">
      {/* Trending by Genre */}
      {['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror'].map((genre) => (
        <div key={genre} className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-green-400">Trending in {genre}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((item) => (
              <div 
                key={item}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-xl aspect-[2/3] bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 hover:border-green-400/60 transition-all duration-300">
                  {/* Placeholder for thumbnail */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-green-400 font-semibold text-sm">{genre}</p>
                      <p className="text-white/60 text-xs mt-1">Content #{item}</p>
                    </div>
                  </div>
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transform scale-90 group-hover:scale-100 transition-transform">
                      Watch Now
                    </button>
                  </div>
                </div>
                <h3 className="mt-3 text-white font-medium group-hover:text-green-400 transition-colors">
                  {genre} Title {item}
                </h3>
                <p className="text-gray-400 text-sm">2024 • 2h 15m</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Trending;
