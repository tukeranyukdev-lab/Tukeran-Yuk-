import React from 'react';
import { Search, PlusCircle, User, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Navbar: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 glass border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => onNavigate('home')}
          >
            <img src="/logo_tukeranyuk.png" alt="TukeranYuk Logo" className="h-10 w-auto" />
            <span className="hidden sm:block text-xl font-bold tracking-tight text-gray-900">
              Tukeran<span className="text-brand-600">Yuk</span>
            </span>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari barang untuk dibarter..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-brand-500 rounded-full text-sm transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('marketplace')}
              className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors"
            >
              Marketplace
            </button>
            
            {user ? (
              <>
                {user.role === 'admin' && (
                  <button 
                    onClick={() => onNavigate('admin')}
                    className="text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors px-3 py-1 bg-brand-50 rounded-lg border border-brand-100"
                  >
                    Admin
                  </button>
                )}
                <button 
                  onClick={() => onNavigate('post-item')}
                  className="flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-brand-700 transition-all shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tuker Barang</span>
                </button>
                
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                  <div 
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => onNavigate('dashboard')}
                  >
                    <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full border border-gray-200" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-brand-600">{user.username}</span>
                  </div>
                  <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <button 
                onClick={() => onNavigate('login')}
                className="bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-gray-800 transition-all"
              >
                Masuk
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
