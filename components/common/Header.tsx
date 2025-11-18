
import React, { useContext } from 'react';
import { AuthContext } from '../../App';
import { User } from '../../types';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  user: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const auth = useContext(AuthContext);

  return (
    <header className="bg-[var(--bg-header)] backdrop-blur-lg shadow-lg sticky top-0 z-50 border-b border-[var(--border-color-light)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-2 sm:space-x-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-9 sm:w-9 text-violet-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 011.085.12L10 11.852l3.665-3.681a.999.999 0 011.085-.12L17.394 6.92a1 1 0 000-1.84l-7-3zM10 15a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1z" />
             </svg>
            <h1 className="text-sm sm:text-xl lg:text-2xl font-bold text-[var(--text-primary)] truncate">
              <span className="hidden sm:inline">HALİL HOCA'NIN ŞAMPİYONLARI</span>
              <span className="sm:hidden">HALİL HOCA</span>
            </h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="text-[var(--text-secondary)] hidden lg:block text-sm">Hoş geldin, <span className="font-semibold text-[var(--text-primary)]">{user.fullName}</span></span>
            <ThemeToggle />
            <button
              onClick={auth?.logout}
              className="px-2 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg hover:from-rose-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition duration-200 text-xs sm:text-sm font-medium shadow-md hover:shadow-lg"
            >
              <span className="hidden sm:inline">Çıkış Yap</span>
              <span className="sm:hidden">Çıkış</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
