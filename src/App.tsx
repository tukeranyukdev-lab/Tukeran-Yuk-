import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { PreferencesProvider, usePreferences } from './hooks/usePreferences';
import { Navbar } from './components/Navbar';
import { io } from 'socket.io-client';
import { playNotificationSound } from './utils/notifications';
import { requestNotificationPermission, showNotification } from './utils/pushNotifications';
import { Home } from './pages/Home';
import { Marketplace } from './pages/Marketplace';
import { ItemDetails } from './pages/ItemDetails';
import { PostItem } from './pages/PostItem';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/AdminDashboard';
import { Messages } from './pages/Messages';
import { Community } from './pages/Community';
import { SafeZones } from './pages/SafeZones';
import { KYC } from './pages/KYC';
import { Wishlist } from './pages/Wishlist';
import { StaticPage } from './pages/StaticPage';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <AppContent />
      </PreferencesProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { user } = useAuth();
  const { theme, t } = usePreferences();
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    requestNotificationPermission();
    if (user) {
      const socket = io();
      socket.emit('join_user_notifications', user.id);
      
      socket.on('notification', (notif) => {
        playNotificationSound();
        showNotification(notif.title, { body: notif.message });
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user]);

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
      case 'messages': return <Messages onNavigate={navigate} initialConversationId={selectedId} />;
      case 'community': return <Community onNavigate={navigate} />;
      case 'safe-zones': 
      case 'meeting-points':
      case 'safe-zone':
        return <SafeZones onNavigate={navigate} />;
      case 'login': return <Login onNavigate={navigate} />;
      case 'register': return <Register onNavigate={navigate} />;
      case 'admin': return <AdminDashboard onNavigate={navigate} />;
      case 'kyc': return <KYC onNavigate={navigate} />;
      case 'wishlist': return <Wishlist onNavigate={navigate} />;
      case 'how-it-works':
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
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-[#0f172a]' : 'bg-[#f9fafb]'}`}>
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
      
      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50">
        <button 
          onClick={() => navigate('home')}
          className={`flex flex-col items-center gap-1 ${currentPage === 'home' ? 'text-brand-600' : 'text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button 
          onClick={() => navigate('marketplace')}
          className={`flex flex-col items-center gap-1 ${currentPage === 'marketplace' ? 'text-brand-600' : 'text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          <span className="text-[10px] font-medium">Pasar</span>
        </button>
        <button 
          onClick={() => navigate('post-item')}
          className="flex flex-col items-center -mt-8"
        >
          <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-200 border-4 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          </div>
          <span className="text-[10px] font-medium text-brand-600 mt-1">Post</span>
        </button>
        <button 
          onClick={() => navigate('messages')}
          className={`flex flex-col items-center gap-1 ${currentPage === 'messages' ? 'text-brand-600' : 'text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span className="text-[10px] font-medium">Pesan</span>
        </button>
        <button 
          onClick={() => navigate('dashboard')}
          className={`flex flex-col items-center gap-1 ${currentPage === 'dashboard' ? 'text-brand-600' : 'text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span className="text-[10px] font-medium">Profil</span>
        </button>
      </div>

      <footer className="bg-white border-t border-gray-100 py-12 mt-20 pb-24 md:pb-12">
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
                {t('footer.desc')}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6">{t('nav.marketplace')}</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><button onClick={() => navigate('marketplace')} className="hover:text-brand-600 transition-colors">{t('nav.marketplace')}</button></li>
                <li><button onClick={() => navigate('community')} className="hover:text-brand-600 transition-colors">{t('dashboard.community.title')}</button></li>
                <li><button onClick={() => navigate('how-it-works')} className="hover:text-brand-600 transition-colors">Cara Kerja</button></li>
                <li><button onClick={() => navigate('meeting-points')} className="hover:text-brand-600 transition-colors">{t('nav.safezones')}</button></li>
                <li><button onClick={() => navigate('safe-zone')} className="hover:text-brand-600 transition-colors">SBM Safe Zone</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6">{t('footer.help')}</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><button onClick={() => navigate('help-center')} className="hover:text-brand-600 transition-colors">{t('footer.help_center')}</button></li>
                <li><button onClick={() => navigate('community-rules')} className="hover:text-brand-600 transition-colors">{t('footer.rules')}</button></li>
                <li><button onClick={() => navigate('security')} className="hover:text-brand-600 transition-colors">{t('footer.security')}</button></li>
                <li><button onClick={() => navigate('contact')} className="hover:text-brand-600 transition-colors">{t('footer.contact')}</button></li>
                <li><button onClick={() => navigate('admin')} className="text-[10px] text-gray-300 hover:text-brand-600 transition-colors mt-4">Admin Access</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 mt-12 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-gray-400">{t('footer.copyright')}</p>
            <div className="flex gap-6">
              <button onClick={() => navigate('privacy')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{t('footer.privacy')}</button>
              <button onClick={() => navigate('terms')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{t('footer.terms')}</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

