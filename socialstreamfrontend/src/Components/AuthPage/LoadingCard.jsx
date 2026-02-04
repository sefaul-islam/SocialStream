/**
 * LoadingCard Component
 * Displays an animated loading card during authentication processes
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingCard = ({ isLoading, message = 'Authenticating...' }) => {
  return (
    <AnimatePresence>
      {isLoading && (        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl p-8 border border-green-500/30 shadow-2xl shadow-green-500/20"
          >
            {/* Animated border glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 blur-xl animate-pulse"></div>
            
            {/* Content */}
            <div className="relative flex flex-col items-center gap-6">
              {/* Spinner Animation */}
              <div className="relative w-20 h-20">
                {/* Outer ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-green-500/20"
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
                </motion.div>
                
                {/* Inner ring */}
                <motion.div
                  className="absolute inset-2 rounded-full border-4 border-emerald-500/30"
                  animate={{
                    rotate: -360,
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full"></div>
                </motion.div>
                
                {/* Center dot */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-lg shadow-green-500/50"></div>
                </motion.div>
              </div>

              {/* Loading text */}
              <div className="text-center">
                <motion.h3
                  className="text-xl font-semibold text-white mb-2"
                  animate={{
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {message}
                </motion.h3>
                <p className="text-sm text-gray-400">Please wait a moment</p>
              </div>

              {/* Animated dots */}
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-green-500 rounded-full"
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingCard;
