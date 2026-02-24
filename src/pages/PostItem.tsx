import React, { useState } from 'react';
import { Camera, Zap, Info, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';

export const PostItem: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Gadget',
    condition: 'Bekas Bagus',
    estimated_value: '',
    wishlist: '',
    location: '',
    image_url: ''
  });
  const [isValuating, setIsValuating] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const handleAiValuation = async () => {
    if (!formData.title) return alert('Masukkan nama barang dulu!');
    setIsValuating(true);
    try {
      const res = await fetch('/api/ai/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: formData.title,
          condition: formData.condition,
          description: formData.description
        })
      });
      const data = await res.json();
      setAiResult(data);
      setFormData({ ...formData, estimated_value: data.max_price.toString() });
    } catch (err) {
      console.error(err);
    } finally {
      setIsValuating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        user_id: user.id,
        estimated_value: parseInt(formData.estimated_value),
        image_url: formData.image_url || `https://picsum.photos/seed/${Date.now()}/800/600`
      })
    });

    if (res.ok) {
      alert('Barang berhasil diposting!');
      onNavigate('marketplace');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <button 
        onClick={() => onNavigate('marketplace')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Batal</span>
      </button>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Posting Barang Barter</h1>
          <p className="text-gray-500 mb-10">Lengkapi detail barang kamu untuk menarik minat barter.</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Image Upload Placeholder */}
            <div className="grid grid-cols-1 gap-6">
              <div className="aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all group">
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-bold text-gray-900">Upload Foto Barang</p>
                <p className="text-xs text-gray-400 mt-1">Maksimal 5 foto • JPG, PNG</p>
              </div>
              <input 
                type="text" 
                placeholder="Atau masukkan URL gambar..."
                value={formData.image_url}
                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                className="w-full px-6 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Nama Barang</label>
                <input 
                  required
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Contoh: iPhone 13 Pro Max 256GB"
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Kategori</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium appearance-none"
                >
                  {['Gadget', 'Kamera', 'Hobi', 'Elektronik', 'Kendaraan', 'Furniture'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Deskripsi & Kondisi</label>
              <textarea 
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Jelaskan detail barang, minus (jika ada), dan kelengkapan..."
                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Kondisi Fisik</label>
                <select 
                  value={formData.condition}
                  onChange={(e) => setFormData({...formData, condition: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium appearance-none"
                >
                  {['Baru', 'Seperti Baru', 'Bekas Bagus', 'Bekas'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Lokasi Barang</label>
                <input 
                  required
                  type="text" 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Contoh: Jakarta Selatan"
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Estimasi Nilai Barang (Rp)</label>
                <button 
                  type="button"
                  onClick={handleAiValuation}
                  disabled={isValuating}
                  className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  {isValuating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  <span>Cek Estimasi AI</span>
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                <input 
                  required
                  type="number" 
                  value={formData.estimated_value}
                  onChange={(e) => setFormData({...formData, estimated_value: e.target.value})}
                  placeholder="0"
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold"
                />
              </div>
              {aiResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-brand-50 p-4 rounded-2xl border border-brand-100 space-y-2"
                >
                  <div className="flex items-center gap-2 text-brand-700 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Rekomendasi AI: Rp {aiResult.min_price.toLocaleString()} - {aiResult.max_price.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-brand-600 leading-relaxed">{aiResult.reasoning}</p>
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Wishlist (Ingin Barter Dengan Apa?)</label>
              <input 
                required
                type="text" 
                value={formData.wishlist}
                onChange={(e) => setFormData({...formData, wishlist: e.target.value})}
                placeholder="Contoh: Kamera Mirrorless / Laptop Gaming"
                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium"
              />
            </div>

            <div className="pt-6">
              <button 
                type="submit"
                className="w-full bg-brand-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-brand-700 transition-all shadow-xl shadow-brand-100"
              >
                Posting Barang Sekarang
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
