import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../utils/api';
import { 
  Users, 
  Package, 
  ShieldCheck, 
  AlertCircle, 
  TrendingUp, 
  Search, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Star,
  CreditCard,
  Wallet,
  Sparkles,
  Eye,
  Check,
  Ban,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Item } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

interface Location {
  id: number;
  name: string;
  address: string;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  image_url?: string;
}

interface EscrowAccount {
  id: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_active: number;
  created_at: string;
}

export const AdminDashboard: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'items' | 'safe_zones' | 'verifications' | 'reports' | 'settings' | 'escrow_accounts' | 'topups'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [kycRequests, setKycRequests] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [escrowAccounts, setEscrowAccounts] = useState<EscrowAccount[]>([]);
  const [topupRequests, setTopupRequests] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [statsData, setStatsData] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // KYC Auto-check state
  const [isAutoChecking, setIsAutoChecking] = useState(false);
  const [autoCheckResult, setAutoCheckResult] = useState<any>(null);
  
  // Location Form State
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationForm, setLocationForm] = useState({
    name: '',
    address: '',
    type: 'public',
    description: '',
    latitude: 0,
    longitude: 0,
    image_url: ''
  });

  // Escrow Account Form State
  const [isEscrowModalOpen, setIsEscrowModalOpen] = useState(false);
  const [editingEscrow, setEditingEscrow] = useState<EscrowAccount | null>(null);
  const [escrowForm, setEscrowForm] = useState({
    bank_name: '',
    account_number: '',
    account_holder: '',
    is_active: true
  });

  const [selectedKyc, setSelectedKyc] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'items', label: 'Items', icon: Package },
    { id: 'safe_zones', label: 'Safe Zones', icon: MapPin },
    { id: 'reviews', label: 'Ulasan', icon: Star },
    { id: 'verifications', label: 'Verifikasi', icon: ShieldCheck },
    { id: 'topups', label: 'Top-up Manual', icon: Wallet },
    { id: 'reports', label: 'Laporan', icon: AlertCircle },
    { id: 'escrow_accounts', label: 'Rekening Escrow', icon: CreditCard },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  const activeTabData = tabs.find(t => t.id === activeTab) || tabs[0];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoints = [
          { name: 'users', url: '/api/admin/users' },
          { name: 'items', url: '/api/items' },
          { name: 'locations', url: '/api/locations' },
          { name: 'kyc', url: '/api/admin/kyc' },
          { name: 'reviews', url: '/api/admin/reviews' },
          { name: 'disputes', url: '/api/admin/disputes' },
          { name: 'escrow_accounts', url: '/api/admin/escrow-accounts' },
          { name: 'topups', url: '/api/admin/topups' },
          { name: 'analytics', url: '/api/admin/analytics' },
          { name: 'stats', url: '/api/admin/stats' },
          { name: 'activities', url: '/api/admin/activities' }
        ];

        const results = await Promise.all(
          endpoints.map(async (ep) => {
            try {
              const res = await apiFetch(ep.url);
              if (!res.ok) {
                console.error(`Fetch failed for ${ep.name}: ${res.status} ${res.statusText}`);
                return null;
              }
              const contentType = res.headers.get('content-type');
              if (!contentType || !contentType.includes('application/json')) {
                console.error(`Invalid content type for ${ep.name}: ${contentType}`);
                return null;
              }
              return await res.json();
            } catch (err) {
              console.error(`Error fetching ${ep.name}:`, err);
              return null;
            }
          })
        );

        if (results[0]) setUsers(results[0]);
        if (results[1]) setItems(results[1]);
        if (results[2]) setLocations(results[2]);
        if (results[3]) setKycRequests(results[3]);
        if (results[4]) setReviews(results[4]);
        if (results[5]) setDisputes(results[5]);
        if (results[6]) setEscrowAccounts(results[6]);
        if (results[7]) setTopupRequests(results[7]);
        if (results[8]) setAnalyticsData(results[8]);
        if (results[9]) setStatsData(results[9]);
        if (results[10]) setActivities(results[10]);
      } catch (error) {
        console.error('Error in Promise.all fetching admin data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingLocation ? 'PUT' : 'POST';
    const url = editingLocation ? `/api/admin/locations/${editingLocation.id}` : '/api/admin/locations';

    try {
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(locationForm)
      });

      if (res.ok) {
        // Refresh locations
        const locRes = await apiFetch('/api/locations');
        setLocations(await locRes.json());
        setIsLocationModalOpen(false);
        setEditingLocation(null);
        setLocationForm({ name: '', address: '', type: 'public', description: '', latitude: 0, longitude: 0, image_url: '' });
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const handleDeleteLocation = async (id: number) => {
    if (!confirm('Hapus lokasi ini?')) return;
    try {
      const res = await apiFetch(`/api/admin/locations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLocations(locations.filter(l => l.id !== id));
      }
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  const openEditLocation = (loc: Location) => {
    setEditingLocation(loc);
    setLocationForm({
      name: loc.name,
      address: loc.address,
      type: loc.type,
      description: loc.description,
      latitude: loc.latitude,
      longitude: loc.longitude,
      image_url: loc.image_url || ''
    });
    setIsLocationModalOpen(true);
  };

  const handleUpdateKYCStatus = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const res = await apiFetch(`/api/admin/kyc/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, admin_notes: adminNotes })
      });
      if (res.ok) {
        setKycRequests(kycRequests.map(k => k.id === id ? { ...k, status } : k));
        setSelectedKyc(null);
        setAdminNotes('');
        setAutoCheckResult(null);
      }
    } catch (error) {
      console.error("Error updating KYC status:", error);
    }
  };

  const handleAutoCheckKYC = async (id: number) => {
    setIsAutoChecking(true);
    setAutoCheckResult(null);
    try {
      const res = await apiFetch(`/api/admin/kyc/${id}/auto-check`, { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        setAutoCheckResult(result);
      }
    } catch (error) {
      console.error("Error performing KYC auto-check:", error);
    } finally {
      setIsAutoChecking(false);
    }
  };

  const handleUpdateTopupStatus = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const res = await apiFetch(`/api/admin/topups/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setTopupRequests(topupRequests.map(t => t.id === id ? { ...t, status } : t));
      }
    } catch (error) {
      console.error("Error updating top-up status:", error);
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (!confirm('Hapus ulasan ini?')) return;
    try {
      const res = await apiFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReviews(reviews.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const handleResolveDispute = async (id: number) => {
    if (!confirm('Tandai laporan ini sebagai selesai?')) return;
    try {
      const res = await apiFetch(`/api/admin/disputes/${id}/resolve`, { method: 'PATCH' });
      if (res.ok) {
        setDisputes(disputes.map(d => d.id === id ? { ...d, status: 'resolved' } : d));
      }
    } catch (error) {
      console.error("Error resolving dispute:", error);
    }
  };

  const handleSaveEscrowAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingEscrow ? 'PUT' : 'POST';
    const url = editingEscrow ? `/api/admin/escrow-accounts/${editingEscrow.id}` : '/api/admin/escrow-accounts';

    try {
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(escrowForm)
      });

      if (res.ok) {
        const updated = await res.json();
        if (editingEscrow) {
          setEscrowAccounts(escrowAccounts.map(a => a.id === editingEscrow.id ? updated : a));
        } else {
          setEscrowAccounts([updated, ...escrowAccounts]);
        }
        setIsEscrowModalOpen(false);
        setEditingEscrow(null);
        setEscrowForm({ bank_name: '', account_number: '', account_holder: '', is_active: true });
      }
    } catch (error) {
      console.error('Error saving escrow account:', error);
    }
  };

  const handleDeleteEscrowAccount = async (id: number) => {
    if (!confirm('Hapus rekening ini?')) return;
    try {
      const res = await apiFetch(`/api/admin/escrow-accounts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEscrowAccounts(escrowAccounts.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error('Error deleting escrow account:', error);
    }
  };

  const openEditEscrow = (acc: EscrowAccount) => {
    setEditingEscrow(acc);
    setEscrowForm({
      bank_name: acc.bank_name,
      account_number: acc.account_number,
      account_holder: acc.account_holder,
      is_active: acc.is_active === 1
    });
    setIsEscrowModalOpen(true);
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h1 className="text-2xl font-bold">Akses Ditolak</h1>
        <p className="text-gray-500">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        <button onClick={() => onNavigate('home')} className="text-brand-600 font-bold">Kembali ke Beranda</button>
      </div>
    );
  }

  const stats = [
    { label: 'Total Pengguna', value: statsData?.totalUsers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Barang Aktif', value: statsData?.totalItems || 0, icon: Package, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Menunggu Verifikasi', value: statsData?.pendingVerifications || 0, icon: ShieldCheck, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Transaksi Berhasil', value: statsData?.successfulTrades || 0, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar / Mobile Nav */}
        <aside className="w-full lg:w-64 flex flex-col gap-4">
          {/* Desktop User Profile */}
          <div className="p-4 bg-gray-900 rounded-2xl text-white hidden lg:block">
            <div className="flex items-center gap-3">
              <img src={user.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-white/20" />
              <div>
                <p className="font-bold text-sm truncate">{user.username}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Administrator</p>
              </div>
            </div>
          </div>

          {/* Mobile Rollup Menu */}
          <div className="lg:hidden relative">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-full flex items-center justify-between bg-white px-5 py-4 rounded-2xl border border-gray-200 shadow-sm active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                  <activeTabData.icon className="w-4 h-4 text-brand-600" />
                </div>
                <span className="font-bold text-gray-900">{activeTabData.label}</span>
              </div>
              <motion.div
                animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isMobileMenuOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="fixed inset-0 bg-black/5 z-30"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl z-40 overflow-hidden"
                  >
                    <div className="p-2">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id as any);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                          <tab.icon className="w-5 h-5" />
                          <span>{tab.label}</span>
                        </button>
                      ))}
                      <div className="my-2 border-t border-gray-50" />
                      <button 
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Keluar</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Vertical Navigation */}
          <nav className="hidden lg:flex flex-col gap-1">
            {tabs.map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
            
            <div className="pt-4 mt-4 border-t border-gray-100">
              <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50">
                <LogOut className="w-5 h-5" />
                <span>Keluar</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-6 md:space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Analytics Charts */}
              {analyticsData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Transaction Trends */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-brand-600" />
                      Tren Transaksi Harian
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.dailyTrends}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fill: '#9ca3af' }}
                            minTickGap={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fill: '#9ca3af' }}
                            width={30}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#FF6321" 
                            strokeWidth={3} 
                            dot={{ r: 4, fill: '#FF6321', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Popular Categories */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Package className="w-4 h-4 text-brand-600" />
                      Kategori Terpopuler
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.popularCategories} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="category" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fill: '#4b5563', fontWeight: 600 }}
                            width={70}
                          />
                          <Tooltip 
                            cursor={{ fill: '#f9fafb' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                            {analyticsData.popularCategories.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#FF6321' : '#f3f4f6'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">Aktivitas Terbaru</h3>
                  <button className="text-xs font-bold text-brand-600 hover:underline">Lihat Semua</button>
                </div>
                <div className="divide-y divide-gray-50">
                  {activities.map(act => (
                    <div key={act.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">{act.user[0]}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate"><span className="text-brand-600">{act.user}</span> {act.action}</p>
                          <p className="text-[10px] text-gray-400">{act.time}</p>
                        </div>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'users' || activeTab === 'items') && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{activeTab === 'users' ? 'Manajemen Pengguna' : 'Manajemen Barang'}</h2>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Cari..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">{activeTab === 'users' ? 'Pengguna' : 'Barang'}</th>
                        <th className="px-6 py-4">{activeTab === 'users' ? 'Email / Lokasi' : 'Pemilik / Nilai'}</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {activeTab === 'users' ? users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={u.avatar} alt="" className="w-8 h-8 rounded-full border border-gray-100" />
                              <span className="text-sm font-bold text-gray-900">{u.username}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-500">{u.email}</p>
                            <p className="text-[10px] text-gray-400 font-medium">Jakarta, ID</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.verified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              {u.verified ? 'Terverifikasi' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
                              <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><XCircle className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      )) : items.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                              <span className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{item.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-500">{item.owner_name}</p>
                            <p className="text-[10px] text-gray-400 font-bold">Rp {item.estimated_value.toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button className="p-1.5 text-gray-400 hover:text-gray-600"><MoreVertical className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'safe_zones' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Manajemen Safe Zones</h2>
                <button 
                  onClick={() => {
                    setEditingLocation(null);
                    setLocationForm({ name: '', address: '', type: 'public', description: '', latitude: 0, longitude: 0, image_url: '' });
                    setIsLocationModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Lokasi
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Lokasi</th>
                        <th className="px-6 py-4">Alamat</th>
                        <th className="px-6 py-4">Tipe</th>
                        <th className="px-6 py-4">Koordinat</th>
                        <th className="px-6 py-4">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {locations.map(loc => (
                        <tr key={loc.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-gray-900">{loc.name}</p>
                            <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{loc.description}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-gray-500 max-w-[200px] truncate">{loc.address}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              loc.type === 'premium' ? 'bg-purple-100 text-purple-700' :
                              loc.type === 'partner' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {loc.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[10px] text-gray-400 font-mono">
                              {loc.latitude != null ? loc.latitude.toFixed(4) : '0.0000'}, {loc.longitude != null ? loc.longitude.toFixed(4) : '0.0000'}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => openEditLocation(loc)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteLocation(loc.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Location Modal */}
              <AnimatePresence>
                {isLocationModalOpen && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsLocationModalOpen(false)}
                      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden"
                    >
                      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900">{editingLocation ? 'Edit Lokasi' : 'Tambah Lokasi Baru'}</h3>
                        <button onClick={() => setIsLocationModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                          <X className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                      
                      <form onSubmit={handleSaveLocation} className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Lokasi</label>
                            <input 
                              required
                              type="text" 
                              value={locationForm.name}
                              onChange={(e) => setLocationForm({...locationForm, name: e.target.value})}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" 
                            />
                          </div>
                          <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alamat Lengkap</label>
                            <input 
                              required
                              type="text" 
                              value={locationForm.address}
                              onChange={(e) => setLocationForm({...locationForm, address: e.target.value})}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tipe</label>
                            <select 
                              value={locationForm.type}
                              onChange={(e) => setLocationForm({...locationForm, type: e.target.value})}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                            >
                              <option value="public">Public</option>
                              <option value="partner">Partner</option>
                              <option value="premium">Premium</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Image URL (Optional)</label>
                            <input 
                              type="text" 
                              value={locationForm.image_url}
                              onChange={(e) => setLocationForm({...locationForm, image_url: e.target.value})}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Latitude</label>
                            <input 
                              required
                              type="number" 
                              step="any"
                              value={locationForm.latitude}
                              onChange={(e) => setLocationForm({...locationForm, latitude: parseFloat(e.target.value)})}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Longitude</label>
                            <input 
                              required
                              type="number" 
                              step="any"
                              value={locationForm.longitude}
                              onChange={(e) => setLocationForm({...locationForm, longitude: parseFloat(e.target.value)})}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" 
                            />
                          </div>
                          <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Deskripsi</label>
                            <textarea 
                              required
                              rows={3}
                              value={locationForm.description}
                              onChange={(e) => setLocationForm({...locationForm, description: e.target.value})}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none" 
                            />
                          </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                          <button 
                            type="button"
                            onClick={() => setIsLocationModalOpen(false)}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all"
                          >
                            Batal
                          </button>
                          <button 
                            type="submit"
                            className="flex-1 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 flex items-center justify-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Simpan
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'verifications' && (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Permintaan Verifikasi</h2>
              <div className="grid gap-4">
                {kycRequests.filter(k => k.status === 'pending').map(k => (
                  <div key={k.id} className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-lg font-bold text-brand-600 flex-shrink-0">
                        {k.username[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Verifikasi KTP: {k.username}</p>
                        <p className="text-xs text-gray-500">Diajukan {new Date(k.created_at).toLocaleDateString()} • {k.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <button 
                        onClick={() => setSelectedKyc(k)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
                      >
                        Lihat Dokumen
                      </button>
                    </div>
                  </div>
                ))}
                {kycRequests.filter(k => k.status === 'pending').length === 0 && (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <p className="text-gray-500">Tidak ada permintaan verifikasi baru.</p>
                  </div>
                )}
              </div>

              {/* KYC Review Modal */}
              <AnimatePresence>
                {selectedKyc && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedKyc(null)}
                      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden"
                    >
                      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900">Review Verifikasi: {selectedKyc.username}</h3>
                        <button onClick={() => setSelectedKyc(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                          <X className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                      
                      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Foto ID</p>
                            <img src={selectedKyc.id_image_url} className="w-full rounded-xl border border-gray-100" alt="ID" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Foto Selfie</p>
                            <img src={selectedKyc.selfie_image_url} className="w-full rounded-xl border border-gray-100" alt="Selfie" />
                          </div>
                        </div>

                        {/* AI Auto-check Section */}
                        <div className="p-4 bg-brand-50 rounded-2xl border border-brand-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-brand-600" />
                              <h4 className="text-sm font-bold text-gray-900">AI Auto-Check (Gemini Vision)</h4>
                            </div>
                            <button 
                              onClick={() => handleAutoCheckKYC(selectedKyc.id)}
                              disabled={isAutoChecking}
                              className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-[10px] font-bold hover:bg-brand-700 disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                              {isAutoChecking ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  Menganalisa...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-3 h-3" />
                                  Jalankan Cek
                                </>
                              )}
                            </button>
                          </div>

                          {autoCheckResult && (
                            <motion.div 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-2 pt-2 border-t border-brand-100"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600">Skor Kecocokan Wajah:</span>
                                <span className={`text-xs font-bold ${autoCheckResult.matchScore > 80 ? 'text-green-600' : 'text-orange-600'}`}>
                                  {autoCheckResult.matchScore}%
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600">Keaslian Dokumen:</span>
                                <span className={`text-xs font-bold ${autoCheckResult.isAuthentic ? 'text-green-600' : 'text-red-600'}`}>
                                  {autoCheckResult.isAuthentic ? 'Terdeteksi Asli' : 'Mencurigakan'}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-500 italic">" {autoCheckResult.reason} "</p>
                            </motion.div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Catatan Admin (Opsional)</label>
                          <textarea 
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Alasan penolakan atau catatan tambahan..."
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleUpdateKYCStatus(selectedKyc.id, 'rejected')}
                            className="flex-1 py-3 bg-red-50 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all"
                          >
                            Tolak Verifikasi
                          </button>
                          <button 
                            onClick={() => handleUpdateKYCStatus(selectedKyc.id, 'approved')}
                            className="flex-1 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
                          >
                            Setujui Verifikasi
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Moderasi Ulasan Safe Zone</h2>
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Lokasi</th>
                        <th className="px-6 py-4">Rating</th>
                        <th className="px-6 py-4">Komentar</th>
                        <th className="px-6 py-4">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {reviews.map(review => (
                        <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-gray-900">{review.username}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-500">{review.location_name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-sm font-bold">{review.rating}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-gray-500 max-w-xs truncate">{review.comment}</p>
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => handleDeleteReview(review.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {reviews.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Belum ada ulasan untuk dimoderasi.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'topups' && (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Permintaan Top-up Manual</h2>
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Jumlah</th>
                        <th className="px-6 py-4">Rekening Tujuan</th>
                        <th className="px-6 py-4">Bukti</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {topupRequests.map(req => (
                        <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-gray-900">{req.username}</p>
                            <p className="text-[10px] text-gray-400">{new Date(req.created_at).toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-brand-600">Rp {req.amount.toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-gray-500">{req.bank_name}</p>
                            <p className="text-[10px] text-gray-400">{req.account_number}</p>
                          </td>
                          <td className="px-6 py-4">
                            <a 
                              href={req.proof_image_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
                            >
                              <Eye className="w-3 h-3" />
                              Lihat Bukti
                            </a>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              req.status === 'approved' ? 'bg-green-100 text-green-700' :
                              req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {req.status === 'pending' ? 'Menunggu' : req.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {req.status === 'pending' && (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleUpdateTopupStatus(req.id, 'approved')}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Setujui"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleUpdateTopupStatus(req.id, 'rejected')}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Tolak"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {topupRequests.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Belum ada permintaan top-up manual.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'escrow_accounts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Manajemen Rekening Escrow</h2>
                <button 
                  onClick={() => {
                    setEditingEscrow(null);
                    setEscrowForm({ bank_name: '', account_number: '', account_holder: '', is_active: true });
                    setIsEscrowModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Rekening
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Bank</th>
                        <th className="px-6 py-4">Nomor Rekening</th>
                        <th className="px-6 py-4">Nama Pemilik</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {escrowAccounts.map(acc => (
                        <tr key={acc.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-gray-900">{acc.bank_name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-500 font-mono">{acc.account_number}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-500">{acc.account_holder}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              acc.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {acc.is_active ? 'Aktif' : 'Non-aktif'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => openEditEscrow(acc)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteEscrowAccount(acc.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {escrowAccounts.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                            Belum ada rekening escrow yang terdaftar.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Escrow Account Modal */}
              <AnimatePresence>
                {isEscrowModalOpen && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsEscrowModalOpen(false)}
                      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden"
                    >
                      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900">{editingEscrow ? 'Edit Rekening' : 'Tambah Rekening Baru'}</h3>
                        <button onClick={() => setIsEscrowModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                          <X className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                      
                      <form onSubmit={handleSaveEscrowAccount} className="p-6 space-y-4">
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Bank</label>
                            <input 
                              required
                              type="text" 
                              placeholder="Contoh: Bank Central Asia (BCA)"
                              value={escrowForm.bank_name}
                              onChange={(e) => setEscrowForm({...escrowForm, bank_name: e.target.value})}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nomor Rekening</label>
                            <input 
                              required
                              type="text" 
                              placeholder="Contoh: 1234567890"
                              value={escrowForm.account_number}
                              onChange={(e) => setEscrowForm({...escrowForm, account_number: e.target.value})}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Pemilik Rekening</label>
                            <input 
                              required
                              type="text" 
                              placeholder="Contoh: PT Tukeran Yuk Indonesia"
                              value={escrowForm.account_holder}
                              onChange={(e) => setEscrowForm({...escrowForm, account_holder: e.target.value})}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" 
                            />
                          </div>
                          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <input 
                              type="checkbox" 
                              id="is_active"
                              checked={escrowForm.is_active}
                              onChange={(e) => setEscrowForm({...escrowForm, is_active: e.target.checked})}
                              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">Rekening Aktif</label>
                          </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                          <button 
                            type="button"
                            onClick={() => setIsEscrowModalOpen(false)}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all"
                          >
                            Batal
                          </button>
                          <button 
                            type="submit"
                            className="flex-1 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 flex items-center justify-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Simpan
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Pengaturan Sistem</h2>
              <div className="grid gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-brand-600" />
                    Konfigurasi Umum
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Platform</label>
                      <input type="text" defaultValue="TukeranYuk!" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Support</label>
                      <input type="email" defaultValue="support@tukeranyuk.com" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-brand-600" />
                    Keamanan & Moderasi
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900">Verifikasi Email Wajib</p>
                        <p className="text-xs text-gray-500">Pengguna harus verifikasi email sebelum posting</p>
                      </div>
                      <div className="w-10 h-5 bg-brand-600 rounded-full relative cursor-pointer">
                        <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900">Moderasi Barang Otomatis</p>
                        <p className="text-xs text-gray-500">Gunakan AI untuk cek konten barang yang dilarang</p>
                      </div>
                      <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all">Batal</button>
                  <button className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-100">Simpan Perubahan</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
