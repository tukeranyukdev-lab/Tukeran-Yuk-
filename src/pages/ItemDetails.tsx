import React, { useEffect, useState } from 'react';
import { MapPin, ShieldCheck, Star, MessageCircle, Repeat, ArrowLeft, Info, Zap } from 'lucide-react';
import { Item, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';

export const ItemDetails: React.FC<{ id: number; onNavigate: (page: string, id?: number) => void }> = ({ id, onNavigate }) => {
  const [item, setItem] = useState<Item | null>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const { user } = useAuth();
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [cashTopup, setCashTopup] = useState(0);

  useEffect(() => {
    fetch(`/api/items/${id}`).then(res => res.json()).then(setItem);
    if (user) {
      fetch('/api/items').then(res => res.json()).then(data => {
        setMyItems(data.filter((i: Item) => i.user_id === user.id));
      });
    }
  }, [id, user]);

  const handlePropose = async () => {
    if (!user || !item) return;
    const res = await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_id: user.id,
        receiver_id: item.user_id,
        sender_item_ids: selectedItemIds,
        receiver_item_id: item.id,
        cash_topup: cashTopup
      })
    });
    if (res.ok) {
      alert('Proposal barter berhasil dikirim!');
      setShowProposalModal(false);
      onNavigate('dashboard');
    }
  };

  if (!item) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button 
        onClick={() => onNavigate('marketplace')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Marketplace</span>
      </button>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Left: Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm">
            <img 
              src={item.image_url || `https://picsum.photos/seed/${item.id}/800/800`} 
              alt={item.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-gray-100 cursor-pointer hover:opacity-80 transition-opacity">
                <img src={`https://picsum.photos/seed/${item.id + i}/200/200`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Info */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-brand-50 text-brand-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">{item.category}</span>
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">{item.condition}</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{item.title}</h1>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{item.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <span>Terverifikasi</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">Estimasi Nilai Pasar</span>
              <span className="text-2xl font-bold text-gray-900">Rp {item.estimated_value.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-brand-600 font-bold uppercase tracking-widest bg-brand-50/50 p-2 rounded-lg">
              <Zap className="w-3 h-3" />
              <span>Estimasi divalidasi oleh AI TukeranYuk</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Deskripsi</h3>
            <p className="text-gray-600 leading-relaxed">{item.description}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Wishlist (Ingin Barter Dengan)</h3>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 italic text-gray-600">
              "{item.wishlist}"
            </div>
          </div>

          {/* Owner Info */}
          <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <img src={item.owner_avatar} className="w-12 h-12 rounded-full border border-gray-100" alt="" />
              <div>
                <h4 className="font-bold text-gray-900">{item.owner_name}</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-gray-500 font-medium">{item.owner_rating || 5.0} • Member Sejak 2023</span>
                </div>
              </div>
            </div>
            <button className="p-3 rounded-full bg-gray-50 text-gray-600 hover:bg-brand-50 hover:text-brand-600 transition-all">
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button 
              onClick={() => setShowProposalModal(true)}
              className="flex-1 bg-brand-600 text-white py-4 rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 flex items-center justify-center gap-2"
            >
              <Repeat className="w-5 h-5" />
              <span>Ajukan Barter</span>
            </button>
            <button className="bg-white text-gray-900 border border-gray-200 px-6 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all">
              Hubungi
            </button>
          </div>
        </div>
      </div>

      {/* Proposal Modal */}
      <AnimatePresence>
        {showProposalModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProposalModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Ajukan Penawaran Barter</h2>
                  <button onClick={() => setShowProposalModal(false)} className="text-gray-400 hover:text-gray-600">
                    <ArrowLeft className="w-6 h-6 rotate-90" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Pilih Barang Kamu</h3>
                    {myItems.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2">
                        {myItems.map(myItem => (
                          <div 
                            key={myItem.id}
                            onClick={() => {
                              if (selectedItemIds.includes(myItem.id)) {
                                setSelectedItemIds(selectedItemIds.filter(id => id !== myItem.id));
                              } else {
                                setSelectedItemIds([...selectedItemIds, myItem.id]);
                              }
                            }}
                            className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                              selectedItemIds.includes(myItem.id) ? 'border-brand-600 bg-brand-50' : 'border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <img src={myItem.image_url} className="w-12 h-12 rounded-lg object-cover" alt="" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{myItem.title}</p>
                              <p className="text-[10px] text-gray-500">Rp {myItem.estimated_value.toLocaleString('id-ID')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-sm text-gray-500 mb-4">Kamu belum punya barang untuk dibarter.</p>
                        <button 
                          onClick={() => onNavigate('post-item')}
                          className="text-brand-600 font-bold text-sm"
                        >
                          + Tambah Barang Baru
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Tambahan Uang Tunai (Opsional)</h3>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                      <input 
                        type="number" 
                        value={cashTopup}
                        onChange={(e) => setCashTopup(Number(e.target.value))}
                        placeholder="0"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100 flex items-start gap-3">
                    <Info className="w-5 h-5 text-brand-600 mt-0.5" />
                    <p className="text-xs text-brand-800 leading-relaxed">
                      Penawaran kamu akan dikirim ke <strong>{item.owner_name}</strong>. Jika disetujui, kalian bisa memilih titik temu resmi untuk melakukan pertukaran.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowProposalModal(false)}
                    className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handlePropose}
                    disabled={selectedItemIds.length === 0}
                    className="flex-[2] bg-brand-600 text-white py-4 rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Kirim Penawaran
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
