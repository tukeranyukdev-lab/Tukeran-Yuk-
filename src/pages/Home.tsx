import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Shield, Zap, MapPin, Repeat, CheckCircle2 } from 'lucide-react';
import { ItemCard } from '../components/ItemCard';
import { Item } from '../types';

export const Home: React.FC<{ onNavigate: (page: string, id?: number) => void }> = ({ onNavigate }) => {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    fetch('/api/items')
      .then(res => res.json())
      .then(data => setItems(data.slice(0, 4)));
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 px-4 py-2 rounded-full">
                <Shield className="w-4 h-4 text-brand-600" />
                <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Secure Barter Marketplace</span>
              </div>
              
              <h1 className="text-6xl sm:text-7xl font-bold tracking-tight text-gray-900 leading-[0.9]">
                Tuker Barang <br />
                <span className="text-brand-600 italic">Tanpa Ragu.</span>
              </h1>
              
              <p className="text-lg text-gray-500 max-w-lg leading-relaxed">
                Ekosistem barter modern dengan jaminan keamanan, titik temu terverifikasi, dan estimasi nilai berbasis AI.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => onNavigate('marketplace')}
                  className="bg-gray-900 text-white px-8 py-4 rounded-full font-bold hover:bg-gray-800 transition-all flex items-center gap-2 group shadow-xl shadow-gray-200"
                >
                  <span>Mulai Barter</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-full font-bold hover:bg-gray-50 transition-all">
                  Cara Kerja
                </button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} className="w-10 h-10 rounded-full border-2 border-white bg-gray-100" alt="" />
                  ))}
                </div>
                <div className="text-sm">
                  <span className="font-bold text-gray-900">1,200+</span>
                  <span className="text-gray-500 ml-1">User Terverifikasi</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white">
                <img 
                  src="https://images.unsplash.com/photo-1556742049-0234c6495ff9?auto=format&fit=crop&q=80&w=1000" 
                  alt="Barter Experience"
                  className="w-full aspect-[4/5] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                <div className="absolute bottom-8 left-8 right-8 glass p-6 rounded-2xl border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-brand-500 p-2 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Status Transaksi</p>
                        <p className="font-bold text-white">Barter Berhasil!</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Nilai</p>
                      <p className="font-bold text-white">Rp 4.5jt</p>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-brand-500" />
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 animate-bounce-slow">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <Zap className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Valuation</p>
                    <p className="text-sm font-bold text-gray-900">Akurat 98%</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: "Aman & Terpercaya", desc: "Verifikasi identitas berlapis dan sistem rating transparan untuk keamanan maksimal." },
            { icon: MapPin, title: "Titik Temu Resmi", desc: "Pilih lokasi pertemuan di mall, cafe partner, atau Safe Zone premium kami." },
            { icon: Repeat, title: "Barter Fleksibel", desc: "Dukung barter 1:1, multi-barang, hingga barter dengan tambahan uang tunai." }
          ].map((f, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="bg-brand-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-600 transition-colors">
                <f.icon className="w-7 h-7 text-brand-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
              <p className="text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Items */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Barang Terbaru</h2>
            <p className="text-gray-500">Temukan barang impianmu dan ajukan penawaran barter sekarang.</p>
          </div>
          <button 
            onClick={() => onNavigate('marketplace')}
            className="text-brand-600 font-bold flex items-center gap-2 hover:gap-3 transition-all"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map(item => (
            <ItemCard key={item.id} item={item} onClick={(id) => onNavigate('item-details', id)} />
          ))}
        </div>
      </section>
    </div>
  );
};
