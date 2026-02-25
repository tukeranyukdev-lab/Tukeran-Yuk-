import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
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
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';
import { User, Item } from '../types';

export const AdminDashboard: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'items' | 'verifications'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await fetch('/api/admin/users');
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(Array.isArray(usersData) ? usersData : []);
        }

        const itemsRes = await fetch('/api/items');
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          setItems(Array.isArray(itemsData) ? itemsData : []);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      }
    };

    fetchData();
  }, []);

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
    { label: 'Total Pengguna', value: users.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Barang Aktif', value: items.length, icon: Package, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Menunggu Verifikasi', value: 12, icon: ShieldCheck, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Transaksi Berhasil', value: 450, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 space-y-2">
          <div className="p-4 mb-6 bg-gray-900 rounded-2xl text-white">
            <div className="flex items-center gap-3">
              <img src={user.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-white/20" />
              <div>
                <p className="font-bold text-sm truncate">{user.username}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Administrator</p>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Overview</span>
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Users className="w-5 h-5" />
              <span>Manajemen User</span>
            </button>
            <button 
              onClick={() => setActiveTab('items')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'items' ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Package className="w-5 h-5" />
              <span>Manajemen Barang</span>
            </button>
            <button 
              onClick={() => setActiveTab('verifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'verifications' ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Verifikasi</span>
            </button>
            <div className="pt-4 mt-4 border-t border-gray-100">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100">
                <Settings className="w-5 h-5" />
                <span>Pengaturan</span>
              </button>
              <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50">
                <LogOut className="w-5 h-5" />
                <span>Keluar</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">Aktivitas Terbaru</h3>
                  <button className="text-xs font-bold text-brand-600 hover:underline">Lihat Semua</button>
                </div>
                <div className="divide-y divide-gray-50">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">U{i}</div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">User_{i} mendaftarkan barang baru</p>
                          <p className="text-[10px] text-gray-400">2 menit yang lalu</p>
                        </div>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-gray-600"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'users' || activeTab === 'items') && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">{activeTab === 'users' ? 'Manajemen Pengguna' : 'Manajemen Barang'}</h2>
                <div className="relative w-full md:w-64">
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
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">{activeTab === 'users' ? 'Pengguna' : 'Barang'}</th>
                        <th className="px-6 py-4">{activeTab === 'users' ? 'Email / Lokasi' : 'Pemilik / Nilai'}</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {activeTab === 'users' ? users.map(u => (
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
                      )) : items.map(item => (
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
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
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

          {activeTab === 'verifications' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Permintaan Verifikasi</h2>
              <div className="grid gap-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold">V{i}</div>
                      <div>
                        <p className="font-bold text-gray-900">Verifikasi KTP: User_Alpha_{i}</p>
                        <p className="text-xs text-gray-500">Diajukan 4 jam yang lalu • Dokumen lengkap</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all">Lihat Dokumen</button>
                      <button className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all">Setujui</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
