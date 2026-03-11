import React from 'react';
import { Search, PlusCircle, User, LogOut, ShieldCheck, MessageSquare, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePreferences } from '../hooks/usePreferences';
import { apiFetch } from '../utils/api';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { t } = usePreferences();
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [showNotifications, setShowNotifications] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      apiFetch(`/api/notifications/${user.id}`)
        .then(res => res.json())
        .then(setNotifications);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: number) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
  };

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
                placeholder={t('nav.search_placeholder')}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-brand-500 rounded-full text-sm transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => onNavigate('marketplace')}
              className="hidden sm:block text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors"
            >
              {t('nav.marketplace')}
            </button>
            <button 
              onClick={() => onNavigate('safe-zones')}
              className="hidden sm:block text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors"
            >
              {t('nav.safezones')}
            </button>
            
            {user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                {user.role === 'admin' && (
                  <button 
                    onClick={() => onNavigate('admin')}
                    className="flex items-center justify-center text-brand-600 hover:text-brand-700 transition-colors p-2 sm:px-3 sm:py-1 bg-brand-50 rounded-lg border border-brand-100"
                    title="Admin Dashboard"
                  >
                    <ShieldCheck className="w-4 h-4 sm:mr-1.5" />
                    <span className="hidden sm:inline text-sm font-bold">Admin</span>
                  </button>
                )}

                {!user.verified && (
                  <button 
                    onClick={() => onNavigate('kyc')}
                    className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-lg border border-orange-100 hover:bg-orange-100 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs font-bold">{t('nav.verify')}</span>
                  </button>
                )}
                
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-gray-500 hover:text-brand-600 transition-colors relative"
                    title={t('nav.notifications')}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {showNotifications && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20"
                        >
                          <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">{t('nav.notifications')}</h3>
                            <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-bold">{unreadCount} Baru</span>
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                              notifications.map(n => (
                                <div 
                                  key={n.id} 
                                  onClick={() => {
                                    markAsRead(n.id);
                                    if (n.type === 'proposal') onNavigate('dashboard');
                                    setShowNotifications(false);
                                  }}
                                  className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!n.is_read ? 'bg-brand-50/30' : ''}`}
                                >
                                  <p className="text-xs font-bold text-gray-900 mb-1">{n.title}</p>
                                  <p className="text-[11px] text-gray-500 leading-relaxed">{n.content}</p>
                                  <p className="text-[9px] text-gray-400 mt-2">{new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                                </div>
                              ))
                            ) : (
                              <div className="p-8 text-center text-gray-400 text-xs">Belum ada notifikasi</div>
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <button 
                  onClick={() => onNavigate('messages')}
                  className="p-2 text-gray-500 hover:text-brand-600 transition-colors relative"
                  title={t('nav.messages')}
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => onNavigate('post-item')}
                  className="flex items-center gap-1.5 bg-brand-600 text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold hover:bg-brand-700 transition-all shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden xs:inline">{t('nav.post')}</span>
                </button>
                
                <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200">
                  <div 
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => onNavigate('dashboard')}
                  >
                    <img src={user.avatar} alt={user.username} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-200" />
                    <div className="hidden sm:flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-700 group-hover:text-brand-600 truncate max-w-[80px]">{user.username}</span>
                      {user.verified && <ShieldCheck className="w-3 h-3 text-brand-600 fill-brand-600/10" />}
                    </div>
                  </div>
                  <button onClick={logout} className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => onNavigate('login')}
                className="bg-gray-900 text-white px-4 sm:px-6 py-2 rounded-full text-sm font-semibold hover:bg-gray-800 transition-all"
              >
                {t('nav.login')}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
