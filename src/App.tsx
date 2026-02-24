import React, { useState } from 'react';
import { AuthProvider } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Marketplace } from './pages/Marketplace';
import { ItemDetails } from './pages/ItemDetails';
import { PostItem } from './pages/PostItem';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { StaticPage } from './pages/StaticPage';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const navigate = (page: string, id?: number) => {
    setCurrentPage(page);
    if (id !== undefined) setSelectedId(id);
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <Home onNavigate={navigate} />;
      case 'marketplace': return <Marketplace onNavigate={navigate} />;
      case 'item-details': return selectedId ? <ItemDetails id={selectedId} onNavigate={navigate} /> : <Marketplace onNavigate={navigate} />;
      case 'post-item': return <PostItem onNavigate={navigate} />;
      case 'dashboard': return <Dashboard onNavigate={navigate} />;
      case 'login': return <Login onNavigate={navigate} />;
      case 'how-it-works':
      case 'meeting-points':
      case 'safe-zone':
      case 'help-center':
      case 'community-rules':
      case 'security':
      case 'contact':
      case 'privacy':
      case 'terms':
        return <StaticPage type={currentPage} onNavigate={navigate} />;
      default: return <Home onNavigate={navigate} />;
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#f9fafb]">
        <Navbar onNavigate={navigate} />
        <main>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
        
        <footer className="bg-white border-t border-gray-100 py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-12">
              <div className="col-span-2 space-y-6">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('home')}>
                  <img src="/logo_tukeranyuk.png" alt="TukeranYuk Logo" className="h-10 w-auto" />
                  <span className="hidden sm:block text-xl font-bold tracking-tight text-gray-900">
                    Tukeran<span className="text-brand-600">Yuk</span>
                  </span>
                </div>
                <p className="text-gray-500 max-w-sm leading-relaxed">
                  Platform barter terpercaya di Indonesia. Kami menghubungkan orang-orang untuk bertukar barang dengan aman melalui titik temu resmi dan verifikasi identitas.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-6">Platform</h4>
                <ul className="space-y-4 text-sm text-gray-500">
                  <li><button onClick={() => navigate('marketplace')} className="hover:text-brand-600 transition-colors">Marketplace</button></li>
                  <li><button onClick={() => navigate('how-it-works')} className="hover:text-brand-600 transition-colors">Cara Kerja</button></li>
                  <li><button onClick={() => navigate('meeting-points')} className="hover:text-brand-600 transition-colors">Titik Temu Resmi</button></li>
                  <li><button onClick={() => navigate('safe-zone')} className="hover:text-brand-600 transition-colors">SBM Safe Zone</button></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-6">Bantuan</h4>
                <ul className="space-y-4 text-sm text-gray-500">
                  <li><button onClick={() => navigate('help-center')} className="hover:text-brand-600 transition-colors">Pusat Bantuan</button></li>
                  <li><button onClick={() => navigate('community-rules')} className="hover:text-brand-600 transition-colors">Aturan Komunitas</button></li>
                  <li><button onClick={() => navigate('security')} className="hover:text-brand-600 transition-colors">Keamanan</button></li>
                  <li><button onClick={() => navigate('contact')} className="hover:text-brand-600 transition-colors">Hubungi Kami</button></li>
                </ul>
              </div>
            </div>
            <div className="pt-12 mt-12 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-xs text-gray-400">© 2024 TukeranYuk. Dibuat dengan ❤️ untuk komunitas barter Indonesia.</p>
              <div className="flex gap-6">
                <button onClick={() => navigate('privacy')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Kebijakan Privasi</button>
                <button onClick={() => navigate('terms')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Syarat & Ketentuan</button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}

