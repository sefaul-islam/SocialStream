import React from 'react';
import { motion } from 'framer-motion';

const PillNavbar = ({ tabs = [], activeTab, onTabChange, className = '' }) => {
  return (
    <nav className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 ${className}`}>
      <div className="bg-black/20 backdrop-blur-xl rounded-full border border-green-500/20 px-[2px] py-[2px] shadow-2xl">
        <div className="flex items-center gap-1 relative">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 z-10 ${
                activeTab === tab.id
                  ? 'text-green-300'
                  : 'text-white hover:text-green-300'
              }`}
            >
              {/* Active background pill with animation */}
              {activeTab === tab.id && (
                <motion.span
                  layoutId="pillBackground"
                  className="absolute inset-0 bg-black/40 border border-green-500/30 rounded-full -z-10"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30
                  }}
                />
              )}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default PillNavbar;
