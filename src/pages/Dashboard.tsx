import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../utils/api';
import { Item, Proposal } from '../types';
import { 
  Repeat, Package, Clock, CheckCircle2, XCircle, MapPin, 
  MessageCircle, Star, Info, Crown, Heart, AlertTriangle, 
  Settings, Globe, Moon, Sun, Truck, Shield, Award, 
  Sparkles, Download, RefreshCw, CreditCard, Bell, Upload,
  ChevronRight, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePreferences } from '../hooks/usePreferences';
import { PaymentModal } from '../components/PaymentModal';

export const Dashboard: React.FC<{ onNavigate: (page: string, id?: number) => void }> = ({ onNavigate }) => {
  const { user, setUser } = useAuth();
  const { theme, language, toggleTheme, setLanguage, t } = usePreferences();
  const [items, setItems] = useState<Item[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeTab, setActiveTab] = useState<'items' | 'proposals' | 'history' | 'settings'>('proposals');
  const [showReviewModal, setShowReviewModal] = useState<Proposal | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState<Proposal | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<Proposal | null>(null);
  const [badges, setBadges] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isUpdatingBadges, setIsUpdatingBadges] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [topupAmount, setTopupAmount] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [escrowAccounts, setEscrowAccounts] = useState<any[]>([]);
  const [showManualTopup, setShowManualTopup] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<any>(null);
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [isSubmittingTopup, setIsSubmittingTopup] = useState(false);

  const fetchData = () => {
    if (user) {
      apiFetch('/api/items').then(res => res.json()).then(data => {
        setItems(data.filter((i: Item) => i.user_id === user.id));
      });
      apiFetch(`/api/proposals/user/${user.id}`).then(res => res.json()).then(setProposals);
      fetchBadges();
      fetchSuggestions();
      fetchNotifications();
      fetchEscrowAccounts();
    }
  };

  const fetchNotifications = async () => {
    const res = await apiFetch(`/api/notifications/${user?.id}`);
    if (res.ok) setNotifications(await res.json());
  };

  const fetchEscrowAccounts = async () => {
    const res = await apiFetch('/api/admin/escrow-accounts');
    if (res.ok) {
      const data = await res.json();
      setEscrowAccounts(data.filter((a: any) => a.active));
    }
  };

  const markNotificationRead = async (id: number) => {
    const res = await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    if (res.ok) fetchNotifications();
  };

  const fetchBadges = async () => {
    const res = await apiFetch(`/api/users/${user?.id}/badges`);
    if (res.ok) setBadges(await res.json());
  };

  const fetchSuggestions = async () => {
    const res = await apiFetch(`/api/matchmaker/${user?.id}`);
    if (res.ok) setSuggestions(await res.json());
  };

  const updateBadges = async () => {
    setIsUpdatingBadges(true);
    const res = await apiFetch(`/api/users/${user?.id}/update-badges`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setBadges(data.badges);
    }
    setIsUpdatingBadges(false);
  };

  const handleExport = () => {
    window.open(`/api/users/${user?.id}/export`, '_blank');
  };

  const handleTopup = async () => {
    if (!user || topupAmount <= 0) return;
    // Show choice between Stripe and Manual
    setShowManualTopup(true);
  };

  const handleManualTopupSubmit = async () => {
    if (!selectedEscrow || !proofImageUrl) {
      alert('Pilih rekening dan unggah bukti transfer');
      return;
    }
    setIsSubmittingTopup(true);
    const res = await apiFetch('/api/topups', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user?.id,
        amount: topupAmount,
        escrow_account_id: selectedEscrow.id,
        proof_image_url: proofImageUrl
      })
    });
    if (res.ok) {
      alert('Permintaan top-up telah dikirim. Tunggu verifikasi admin.');
      setShowManualTopup(false);
      setTopupAmount(0);
      setProofImageUrl('');
      setSelectedEscrow(null);
    }
    setIsSubmittingTopup(false);
  };

  const onPaymentSuccess = (newBalance: number) => {
    if (user) {
      setUser({ ...user, wallet_balance: newBalance });
      setTopupAmount(0);
      setShowPaymentModal(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleUpdateStatus = async (id: number, status: 'accepted' | 'rejected') => {
    const res = await apiFetch(`/api/proposals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      fetchData();
    }
  };

  const handleUpdateEscrow = async (id: number, status: 'held' | 'released' | 'refunded') => {
    const res = await apiFetch(`/api/proposals/${id}/escrow`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      fetchData();
    }
  };

  const handleSubmitReview = async () => {
    if (!showReviewModal || !user) return;
    const reviewee_id = showReviewModal.sender_id === user.id ? showReviewModal.receiver_id : showReviewModal.sender_id;
    
    const res = await apiFetch('/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        proposal_id: showReviewModal.id,
        reviewer_id: user.id,
        reviewee_id,
        rating,
        comment
      })
    });
    
    if (res.ok) {
      alert('Terima kasih atas ulasanmu!');
      setShowReviewModal(null);
      setRating(5);
      setComment('');
    }
  };

  const handleUpgradePremium = async () => {
    if (!user) return;
    const res = await apiFetch(`/api/users/${user.id}/premium`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setUser({ ...user, is_premium: 1, premium_until: data.premium_until });
      alert('Selamat! Kamu sekarang adalah member Premium.');
    }
  };

  const handleSubmitDispute = async () => {
    if (!showDisputeModal || !user) return;
    const res = await apiFetch('/api/disputes', {
      method: 'POST',
      body: JSON.stringify({
        proposal_id: showDisputeModal.id,
        reporter_id: user.id,
        reason: disputeReason
      })
    });
    if (res.ok) {
      alert('Laporanmu telah dikirim ke admin untuk ditindaklanjuti.');
      setShowDisputeModal(null);
      setDisputeReason('');
    }
  };

  if (!user) return <div className="p-20 text-center">Silakan login dulu.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Profile Sidebar */}
        <aside className="w-full md:w-80 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 text-center space-y-4 relative">
            <div className="absolute top-6 right-6">
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-brand-600 transition-all relative"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
                  )}
                </button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-[110]"
                    >
                      <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                        <h4 className="font-bold text-gray-900">Notifikasi</h4>
                        <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                          {notifications.filter(n => !n.is_read).length} Baru
                        </span>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => markNotificationRead(n.id)}
                            className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer text-left ${!n.is_read ? 'bg-brand-50/30' : ''}`}
                          >
                            <div className="flex gap-3">
                              <div className={`p-2 rounded-xl h-fit ${
                                n.type === 'payment' ? 'bg-blue-50 text-blue-600' :
                                n.type === 'verification' ? 'bg-green-50 text-green-600' :
                                'bg-brand-50 text-brand-600'
                              }`}>
                                {n.type === 'payment' ? <CreditCard className="w-4 h-4" /> :
                                 n.type === 'verification' ? <Shield className="w-4 h-4" /> :
                                 <Bell className="w-4 h-4" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-gray-900 mb-0.5">{n.title}</p>
                                <p className="text-[10px] text-gray-500 line-clamp-2">{n.content}</p>
                                <p className="text-[8px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('id-ID')}</p>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="p-8 text-center text-gray-400 text-xs">
                            Belum ada notifikasi
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="relative inline-block">
              <img src={user.avatar} className="w-24 h-24 rounded-full border-4 border-brand-50 mx-auto" alt="" />
              <div className="absolute bottom-0 right-0 bg-brand-500 p-1.5 rounded-full border-2 border-white">
                {user.is_premium ? <Crown className="w-4 h-4 text-white" /> : <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{user.username}</h2>
                {user.is_premium === 1 && <Crown className="w-4 h-4 text-brand-600" />}
              </div>
              <p className="text-sm text-gray-500 mb-2">{user.email}</p>
              
              {/* Badges Section */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {badges.map((badge, idx) => (
                  <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-brand-50 text-brand-600 rounded-lg border border-brand-100">
                    <Award className="w-3 h-3" />
                    <span className="text-[8px] font-bold uppercase tracking-wider">{badge}</span>
                  </div>
                ))}
                <button 
                  onClick={updateBadges}
                  disabled={isUpdatingBadges}
                  className="p-1 text-gray-400 hover:text-brand-600 transition-colors"
                  title={t('dashboard.badges.update')}
                >
                  <RefreshCw className={`w-3 h-3 ${isUpdatingBadges ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-50">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{items.length}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Barang</p>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{user.rating}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rating</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-gray-900">Wallet Escrow</h3>
              </div>
              <p className="text-lg font-bold text-brand-600">Rp {user.wallet_balance.toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <input 
                type="number" 
                value={topupAmount || ''} 
                onChange={(e) => setTopupAmount(Number(e.target.value))}
                placeholder="Jumlah Top-up"
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button 
                onClick={handleTopup}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all"
              >
                Top-up
              </button>
            </div>
          </div>

          <div className={`${user.verified ? 'bg-brand-600' : 'bg-orange-500'} p-6 rounded-[2rem] text-white shadow-xl shadow-brand-100`}>
            <h3 className="font-bold mb-2">{user.verified ? t('dashboard.verified') : t('dashboard.not_verified')}</h3>
            <p className="text-xs text-white/80 leading-relaxed mb-4">
              {user.verified 
                ? 'Kamu memiliki akses ke semua titik temu premium dan prioritas bantuan admin.' 
                : 'Verifikasi identitas kamu untuk meningkatkan kepercayaan dan akses fitur premium.'}
            </p>
            <button 
              onClick={() => user.verified ? null : onNavigate('kyc')}
              className="w-full bg-white/20 hover:bg-white/30 py-2 rounded-xl text-xs font-bold transition-all"
            >
              {user.verified ? t('common.view') : t('dashboard.verify_now')}
            </button>
          </div>

          <div className={`${user.is_premium ? 'bg-gray-900' : 'bg-brand-50'} p-6 rounded-[2rem] border border-brand-100 shadow-sm`}>
            <div className="flex items-center gap-3 mb-4">
              <Crown className={`w-6 h-6 ${user.is_premium ? 'text-brand-400' : 'text-brand-600'}`} />
              <h3 className={`font-bold ${user.is_premium ? 'text-white' : 'text-gray-900'}`}>TukeranYuk Premium</h3>
            </div>
            <ul className={`text-[10px] space-y-2 mb-6 ${user.is_premium ? 'text-gray-400' : 'text-gray-500'}`}>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-brand-500" />
                Prioritas Listing (Muncul Paling Atas)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-brand-500" />
                Akses Safe Zone Eksklusif
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-brand-500" />
                Badge Mahkota di Profil
              </li>
            </ul>
            {!user.is_premium ? (
              <button 
                onClick={handleUpgradePremium}
                className="w-full bg-brand-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
              >
                {t('dashboard.premium_upgrade')}
              </button>
            ) : (
              <div className="text-center">
                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Aktif Sampai</p>
                <p className="text-xs font-bold text-white">{new Date(user.premium_until!).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => onNavigate('wishlist')}
            className="w-full flex items-center justify-between p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-2 rounded-xl group-hover:bg-red-500 transition-colors">
                <Heart className="w-5 h-5 text-red-500 group-hover:text-white transition-colors" />
              </div>
              <span className="font-bold text-gray-900">{t('dashboard.wishlist')}</span>
            </div>
            <div className="bg-gray-50 px-3 py-1 rounded-full text-xs font-bold text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-all">
              {t('common.view')}
            </div>
          </button>

          {/* AI Matchmaker Suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-6 rounded-[2rem] text-white shadow-xl shadow-brand-100 overflow-hidden relative">
              <div className="absolute -right-4 -top-4 opacity-10">
                <Sparkles className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-bold">{t('dashboard.matchmaker.title')}</h3>
              </div>
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                    <div className="flex items-start gap-3 mb-2">
                      <img src={suggestion.item_image} className="w-12 h-12 rounded-xl object-cover border border-white/20" alt="" />
                      <div>
                        <h4 className="font-bold text-xs line-clamp-1">{suggestion.item_title}</h4>
                        <p className="text-[10px] text-white/70">Est: Rp {suggestion.estimated_value.toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-white/90 italic mb-3 line-clamp-2">"{suggestion.reason}"</p>
                    <button 
                      onClick={() => onNavigate('marketplace')}
                      className="w-full py-2 bg-white text-brand-600 rounded-xl text-[10px] font-bold hover:bg-brand-50 transition-all"
                    >
                      Lihat Barang
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-8">
          <div className="flex gap-4 border-b border-gray-200">
            <button 
              onClick={() => setActiveTab('proposals')}
              className={`pb-4 px-4 text-sm font-bold transition-all relative ${
                activeTab === 'proposals' ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t('dashboard.proposals')}
              {activeTab === 'proposals' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-600 rounded-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('items')}
              className={`pb-4 px-4 text-sm font-bold transition-all relative ${
                activeTab === 'items' ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t('dashboard.my_items')}
              {activeTab === 'items' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-600 rounded-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`pb-4 px-4 text-sm font-bold transition-all relative ${
                activeTab === 'history' ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t('dashboard.history')}
              {activeTab === 'history' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-600 rounded-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`pb-4 px-4 text-sm font-bold transition-all relative ${
                activeTab === 'settings' ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t('dashboard.settings')}
              {activeTab === 'settings' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-600 rounded-full" />}
            </button>
          </div>

          {activeTab === 'history' && (
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{t('dashboard.history')}</h2>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
              >
                <Download className="w-4 h-4" />
                {t('dashboard.history.export')}
              </button>
            </div>
          )}

          {activeTab === 'proposals' ? (
            <div className="space-y-4">
              {proposals.length > 0 ? proposals.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-6 group hover:border-brand-100 transition-all">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-brand-50 p-3 rounded-2xl">
                      <Repeat className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">
                        {p.sender_id === user.id ? `Menawar ${p.receiver_item_title}` : `${p.sender_name} menawar barangmu`}
                      </h4>
                      <div className="flex flex-wrap gap-3 mt-2">
                        <p className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {p.shipping_method || 'COD'}
                        </p>
                        {p.escrow_status !== 'none' && (
                          <p className={`text-[10px] font-bold flex items-center gap-1 ${
                            p.escrow_status === 'released' ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            <Shield className="w-3 h-3" />
                            Escrow: {t(`escrow.${p.escrow_status}`)}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-500 font-bold">
                          {p.cash_topup > 0 ? `+ Rp ${p.cash_topup.toLocaleString()}` : 'Barter Langsung'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {p.status === 'pending' && (
                      <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <Clock className="w-3 h-3" />
                        <span>Menunggu</span>
                      </div>
                    )}
                    {p.status === 'accepted' && (
                      <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Disetujui</span>
                      </div>
                    )}
                    {p.status === 'rejected' && (
                      <div className="flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <XCircle className="w-3 h-3" />
                        <span>Ditolak</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {p.status === 'pending' && p.receiver_id === user.id && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleUpdateStatus(p.id, 'accepted')}
                          className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all"
                        >
                          {t('common.accept')}
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(p.id, 'rejected')}
                          className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all"
                        >
                          {t('common.reject')}
                        </button>
                      </div>
                    )}
                    {p.status === 'accepted' && p.sender_id === user.id && p.escrow_status === 'pending' && (
                      <button 
                        onClick={() => handleUpdateEscrow(p.id, 'held')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
                      >
                        Bayar Top-up (Escrow)
                      </button>
                    )}
                    {p.status === 'accepted' && p.sender_id === user.id && p.escrow_status === 'held' && (
                      <button 
                        onClick={() => handleUpdateEscrow(p.id, 'released')}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all"
                      >
                        Konfirmasi Terima Barang
                      </button>
                    )}
                    {p.status === 'accepted' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowReviewModal(p)}
                          className="px-4 py-2 bg-brand-50 text-brand-600 rounded-xl text-xs font-bold hover:bg-brand-100 transition-all flex items-center gap-1.5"
                        >
                          <Star className="w-3 h-3" />
                          {t('common.review')}
                        </button>
                        <button 
                          onClick={() => setShowDisputeModal(p)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Laporkan Masalah"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <button 
                      onClick={() => onNavigate('messages')}
                      className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:bg-brand-50 hover:text-brand-600 transition-all"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => onNavigate('item-details', p.receiver_item_id)}
                      className="px-6 py-3 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all"
                    >
                      {t('common.detail')}
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-500">{t('dashboard.empty_proposals')}</p>
                </div>
              )}
            </div>
          ) : activeTab === 'history' ? (
            <div className="space-y-4">
              {proposals.filter(p => p.status === 'accepted').length > 0 ? proposals.filter(p => p.status === 'accepted').map(p => (
                <div key={p.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-green-50 p-3 rounded-2xl">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">
                        {p.sender_id === user.id ? `Barter ${p.receiver_item_title}` : `Barter dengan ${p.sender_name}`}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">Selesai pada {new Date(p.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowReceiptModal(p)}
                      className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all"
                    >
                      Cetak Resi
                    </button>
                    <button 
                      onClick={() => setShowReviewModal(p)}
                      className="px-4 py-2 bg-brand-50 text-brand-600 rounded-xl text-xs font-bold hover:bg-brand-100 transition-all"
                    >
                      Ulasan
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-500">{t('dashboard.empty_history')}</p>
                </div>
              )}
            </div>
          ) : activeTab === 'settings' ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-50 p-3 rounded-2xl">
                      <Globe className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{t('settings.language')}</h4>
                      <p className="text-xs text-gray-500 mt-1">{t('settings.language_desc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setLanguage('id')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        language === 'id' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Indonesia
                    </button>
                    <button 
                      onClick={() => setLanguage('en')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        language === 'en' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-50 p-3 rounded-2xl">
                      {theme === 'dark' ? <Moon className="w-6 h-6 text-gray-600" /> : <Sun className="w-6 h-6 text-gray-600" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{t('settings.theme')}</h4>
                      <p className="text-xs text-gray-500 mt-1">{t('settings.theme_desc')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {theme === 'dark' ? t('settings.mode_light') : t('settings.mode_dark')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {items.length > 0 ? items.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex gap-4 group">
                  <img src={item.image_url} className="w-24 h-24 rounded-2xl object-cover" alt="" />
                  <div className="flex-1 min-w-0 py-1">
                    <h4 className="font-bold text-gray-900 truncate group-hover:text-brand-600 transition-colors">{item.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">Est. Rp {item.estimated_value.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-4 text-[10px] text-gray-400 font-medium">
                      <MapPin className="w-3 h-3" />
                      <span>{item.location}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-500">{t('dashboard.empty_items')}</p>
                  <button 
                    onClick={() => onNavigate('post-item')}
                    className="mt-4 text-brand-600 font-bold"
                  >
                    + {t('nav.post')}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Manual Top-up Modal */}
      <AnimatePresence>
        {showManualTopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowManualTopup(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              <div className="flex-1 p-8 bg-gray-50 border-r border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-brand-600" />
                  Top-up Saldo
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Pilih Metode Pembayaran</label>
                    <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={() => setShowPaymentModal(true)}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl hover:border-brand-500 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-brand-50 p-2 rounded-xl group-hover:bg-brand-600 transition-colors">
                            <CreditCard className="w-5 h-5 text-brand-600 group-hover:text-white transition-colors" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-gray-900">Kartu Kredit / Debit</p>
                            <p className="text-[10px] text-gray-500">Instan via Stripe</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>

                      <div className="p-4 bg-white border-2 border-brand-500 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-brand-600 p-2 rounded-xl">
                            <RefreshCw className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-gray-900">Transfer Manual</p>
                            <p className="text-[10px] text-gray-500">Verifikasi admin (1-24 jam)</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {escrowAccounts.map(acc => (
                            <button 
                              key={acc.id}
                              onClick={() => setSelectedEscrow(acc)}
                              className={`w-full p-3 rounded-xl border text-left transition-all ${
                                selectedEscrow?.id === acc.id 
                                  ? 'bg-brand-50 border-brand-200 ring-2 ring-brand-500/20' 
                                  : 'bg-gray-50 border-gray-100 hover:border-brand-200'
                              }`}
                            >
                              <p className="text-xs font-bold text-gray-900">{acc.bank_name}</p>
                              <p className="text-[10px] text-gray-500">{acc.account_number} a/n {acc.account_holder}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-8 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Jumlah Top-up</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                    <input 
                      type="number"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(Number(e.target.value))}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-xl text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bukti Transfer</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setProofImageUrl(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className={`w-full h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                      proofImageUrl ? 'border-brand-500 bg-brand-50/30' : 'border-gray-200 group-hover:border-brand-400 bg-gray-50'
                    }`}>
                      {proofImageUrl ? (
                        <img src={proofImageUrl} className="w-full h-full object-contain rounded-2xl p-2" alt="Proof" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-300" />
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Unggah Foto</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <button 
                    onClick={handleManualTopupSubmit}
                    disabled={isSubmittingTopup || !selectedEscrow || !proofImageUrl || topupAmount <= 0}
                    className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingTopup ? 'Mengirim...' : 'Konfirmasi Pembayaran'}
                  </button>
                  <button 
                    onClick={() => setShowManualTopup(false)}
                    className="w-full py-4 text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-gray-600 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={topupAmount}
        userId={user.id}
        onSuccess={onPaymentSuccess}
      />

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReviewModal(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Beri Ulasan Barter</h2>
              <div className="space-y-6">
                <div className="flex justify-center gap-2">
                  {[1,2,3,4,5].map(s => (
                    <button 
                      key={s} 
                      onClick={() => setRating(s)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star className={`w-10 h-10 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Komentar</label>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Ceritakan pengalaman bartermu..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm h-32 resize-none"
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowReviewModal(null)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSubmitReview}
                    className="flex-[2] py-4 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
                  >
                    Kirim Ulasan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dispute Modal */}
      <AnimatePresence>
        {showDisputeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDisputeModal(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-50 p-2 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Pusat Resolusi</h2>
              </div>
              <div className="space-y-6">
                <p className="text-sm text-gray-500 leading-relaxed">
                  Laporkan kendala yang terjadi saat barter. Admin akan melakukan mediasi untuk membantu menyelesaikan masalahmu.
                </p>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Alasan Laporan</label>
                  <textarea 
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Jelaskan masalah yang terjadi secara detail..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm h-32 resize-none"
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowDisputeModal(null)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSubmitDispute}
                    className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                  >
                    Kirim Laporan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceiptModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReceiptModal(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <div className="text-center space-y-2">
                  <img src="/logo_tukeranyuk.png" className="h-8 mx-auto mb-4" alt="Logo" />
                  <h2 className="text-xl font-bold text-gray-900">Resi Digital Barter</h2>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">ID Transaksi: #TY-{showReceiptModal.id}</p>
                </div>

                <div className="border-y border-dashed border-gray-200 py-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tanggal</span>
                    <span className="font-bold text-gray-900">{new Date(showReceiptModal.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pihak 1</span>
                    <span className="font-bold text-gray-900">{showReceiptModal.sender_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pihak 2</span>
                    <span className="font-bold text-gray-900">{user.username}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Detail Pertukaran</p>
                    <p className="text-sm font-bold text-gray-900">{showReceiptModal.receiver_item_title}</p>
                    {showReceiptModal.cash_topup > 0 && (
                      <p className="text-xs text-brand-600 font-bold mt-1">+ Rp {showReceiptModal.cash_topup.toLocaleString()}</p>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <div className="inline-block p-4 bg-gray-50 rounded-2xl mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
                  </div>
                  <p className="text-xs text-gray-500 italic">Bukti sah transaksi barter melalui platform TukeranYuk!</p>
                </div>

                <button 
                  onClick={() => window.print()}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                >
                  <Repeat className="w-4 h-4" />
                  Cetak Resi
                </button>
              </div>
              <button 
                onClick={() => setShowReceiptModal(null)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
