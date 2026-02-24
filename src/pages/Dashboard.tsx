import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Item, Proposal } from '../types';
import { Repeat, Package, Clock, CheckCircle2, XCircle, MapPin, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const Dashboard: React.FC<{ onNavigate: (page: string, id?: number) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeTab, setActiveTab] = useState<'items' | 'proposals'>('proposals');

  useEffect(() => {
    if (user) {
      fetch('/api/items').then(res => res.json()).then(data => {
        setItems(data.filter((i: Item) => i.user_id === user.id));
      });
      fetch(`/api/proposals/user/${user.id}`).then(res => res.json()).then(setProposals);
    }
  }, [user]);

  if (!user) return <div className="p-20 text-center">Silakan login dulu.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Profile Sidebar */}
        <aside className="w-full md:w-80 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 text-center space-y-4">
            <div className="relative inline-block">
              <img src={user.avatar} className="w-24 h-24 rounded-full border-4 border-brand-50 mx-auto" alt="" />
              <div className="absolute bottom-0 right-0 bg-brand-500 p-1.5 rounded-full border-2 border-white">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.username}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
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

          <div className="bg-brand-600 p-6 rounded-[2rem] text-white shadow-xl shadow-brand-100">
            <h3 className="font-bold mb-2">Member Verified</h3>
            <p className="text-xs text-white/80 leading-relaxed mb-4">Kamu memiliki akses ke semua titik temu premium dan prioritas bantuan admin.</p>
            <button className="w-full bg-white/20 hover:bg-white/30 py-2 rounded-xl text-xs font-bold transition-all">
              Lihat Benefit
            </button>
          </div>
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
              Penawaran Barter
              {activeTab === 'proposals' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-600 rounded-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('items')}
              className={`pb-4 px-4 text-sm font-bold transition-all relative ${
                activeTab === 'items' ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Barang Saya
              {activeTab === 'items' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-600 rounded-full" />}
            </button>
          </div>

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
                      <p className="text-xs text-gray-500 mt-1">
                        {p.cash_topup > 0 ? `Barter + Rp ${p.cash_topup.toLocaleString()}` : 'Barter Langsung'}
                      </p>
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
                    <button className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:bg-brand-50 hover:text-brand-600 transition-all">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => onNavigate('item-details', p.receiver_item_id)}
                      className="px-6 py-3 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all"
                    >
                      Detail
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-500">Belum ada penawaran barter.</p>
                </div>
              )}
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
                  <p className="text-gray-500">Kamu belum memposting barang.</p>
                  <button 
                    onClick={() => onNavigate('post-item')}
                    className="mt-4 text-brand-600 font-bold"
                  >
                    + Posting Sekarang
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
