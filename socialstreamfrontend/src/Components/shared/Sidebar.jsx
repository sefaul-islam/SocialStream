import React, { useState } from 'react';

const Sidebar = ({
  menuItems = [],
  activeItem = null,
  onItemClick = () => {},
  user = null,
  showUserSection = true,
  position = 'left',
  theme = 'dark',
  onLogout = null,
  onUserClick = null,
}) => {
  const [hoveredItem, setHoveredItem] = useState(null);

  const themeClasses = {
    dark: 'bg-gray-900 text-white',
    light: 'bg-white text-gray-900',
    green: 'bg-black text-white',
  };

  const activeClasses = {
    dark: 'bg-gray-800 text-green-400',
    light: 'bg-gray-100 text-green-600',
    green: 'bg-green-500/20 text-green-400',
  };

  const hoverClasses = {
    dark: 'hover:bg-gray-800 hover:text-green-400',
    light: 'hover:bg-gray-100 hover:text-green-600',
    green: 'hover:bg-green-500/10 hover:text-green-400',
  };

  return (
    <aside
      className={`h-screen w-20 ${position === 'right' ? 'order-last' : 'order-first'} ${
        themeClasses[theme]
      } flex flex-col items-center relative z-20`}
    >
      {/* User Section - At Top */}
      {showUserSection && user && (
        <div className="p-4 w-full flex justify-center">
          <div
            onClick={onUserClick}
            className={`relative p-2 rounded-lg ${
              activeItem === 'profile' ? activeClasses[theme] : hoverClasses[theme]
            } transition-colors cursor-pointer group`}
            onMouseEnter={() => setHoveredItem('profile')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="relative">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              {user.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-current rounded-full"></span>
              )}
            </div>

            {/* Tooltip */}
            {hoveredItem === 'profile' && (
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg whitespace-nowrap z-50 shadow-xl border border-green-500/20">
                <div className="font-semibold">{user.name}</div>
                {user.email && (
                  <div className="text-xs text-gray-400">{user.email}</div>
                )}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900"></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 w-full flex flex-col items-center">
        <ul className="space-y-2 w-full flex flex-col items-center">
          {menuItems.map((item, index) => {
            const isActive = activeItem === item.id || activeItem === item.label;
            
            return (
              <li key={item.id || index} className="w-full flex justify-center">
                {item.divider ? (
                  <div className="my-3 border-t border-inherit w-12" />
                ) : (
                  <button
                    onClick={() => onItemClick(item)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`relative p-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? `${activeClasses[theme]}`
                        : `${hoverClasses[theme]}`
                    }`}
                  >
                    {item.icon && (
                      <span className={`${isActive ? 'scale-110' : ''} transition-transform block`}>
                        {typeof item.icon === 'string' ? (
                          <img src={item.icon} alt="" className="w-6 h-6" />
                        ) : (
                          item.icon
                        )}
                      </span>
                    )}

                    {/* Tooltip on Hover */}
                    {hoveredItem === item.id && (
                      <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg whitespace-nowrap z-50 shadow-xl border border-green-500/20">
                        {item.name}
                        {item.badge && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-green-500 text-white rounded-full">
                            {item.badge}
                          </span>
                        )}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900"></div>
                      </div>
                    )}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button at Bottom */}
      {onLogout && (
        <div className="p-4 w-full flex justify-center">
          <button
            onClick={onLogout}
            onMouseEnter={() => setHoveredItem('logout')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`relative p-3 rounded-lg ${hoverClasses[theme]} transition-colors`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>

            {/* Tooltip */}
            {hoveredItem === 'logout' && (
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg whitespace-nowrap z-50 shadow-xl border border-green-500/20">
                Logout
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900"></div>
              </div>
            )}
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;