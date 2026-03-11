import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Shield, Zap, MapPin, Repeat, CheckCircle2, Timer } from 'lucide-react';
import { ItemCard } from '../components/ItemCard';
import { Item } from '../types';
import { usePreferences } from '../hooks/usePreferences';
import { apiFetch } from '../utils/api';

export const Home: React.FC<{ onNavigate: (page: string, id?: number) => void }> = ({ onNavigate }) => {
  const { t } = usePreferences();
  const [items, setItems] = useState<Item[]>([]);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [flashEvents, setFlashEvents] = useState<any[]>([]);

  useEffect(() => {
    apiFetch('/api/items')
      .then(res => res.json())
      .then(data => setItems(data.slice(0, 4)));
    
    apiFetch('/api/social/recent-trades')
      .then(res => res.json())
      .then(data => setRecentTrades(data));

    apiFetch('/api/flash-events/active')
      .then(res => res.json())
      .then(data => setFlashEvents(data));
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        {flashEvents.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-brand-600 to-brand-800 p-6 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-brand-100"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl animate-pulse">
                  <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{flashEvents[0].title}</h3>
                  <p className="text-sm text-white/80">{flashEvents[0].description}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Berakhir Dalam</p>
                  <div className="flex gap-2">
                    <div className="bg-white/10 px-3 py-2 rounded-xl text-lg font-bold">02</div>
                    <div className="bg-white/10 px-3 py-2 rounded-xl text-lg font-bold">45</div>
                    <div className="bg-white/10 px-3 py-2 rounded-xl text-lg font-bold">12</div>
                  </div>
                </div>
                <button 
                  onClick={() => onNavigate('marketplace')}
                  className="bg-white text-brand-600 px-6 py-3 rounded-2xl font-bold hover:bg-brand-50 transition-all shadow-lg"
                >
                  Ikuti Sekarang
                </button>
              </div>
            </motion.div>
          </div>
        )}
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
                {t('hero.title').split(' ').slice(0, 2).join(' ')} <br />
                <span className="text-brand-600 italic">{t('hero.title').split(' ').slice(2).join(' ')}</span>
              </h1>
              
              <p className="text-lg text-gray-500 max-w-lg leading-relaxed">
                {t('hero.subtitle')}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => onNavigate('marketplace')}
                  className="bg-gray-900 text-white px-8 py-4 rounded-full font-bold hover:bg-gray-800 transition-all flex items-center gap-2 group shadow-xl shadow-gray-200"
                >
                  <span>{t('hero.cta')}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => onNavigate('how-it-works')}
                  className="bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-full font-bold hover:bg-gray-50 transition-all"
                >
                  {t('hero.how_it_works')}
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
                  <span className="text-gray-500 ml-1">{t('hero.verified_users')}</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white bg-gray-50">
                <img 
                  src="/hero_background.jpg" 
                  alt="Barter Experience"
                  className="w-full h-auto block"
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
            { icon: Shield, title: t('features.secure.title'), desc: t('features.secure.desc'), page: 'security' },
            { icon: MapPin, title: t('features.safezones.title'), desc: t('features.safezones.desc'), page: 'safe-zones' },
            { icon: Repeat, title: t('features.flexible.title'), desc: t('features.flexible.desc'), page: 'how-it-works' }
          ].map((f, i) => (
            <div 
              key={i} 
              onClick={() => onNavigate(f.page)}
              className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
            >
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('home.recent_items')}</h2>
            <p className="text-gray-500">{t('home.recent_items_desc')}</p>
          </div>
          <button 
            onClick={() => onNavigate('marketplace')}
            className="text-brand-600 font-bold flex items-center gap-2 hover:gap-3 transition-all"
          >
            <span>{t('home.view_all')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map(item => (
            <ItemCard key={item.id} item={item} onClick={(id) => onNavigate('item-details', id)} />
          ))}
        </div>
      </section>

      {/* Social Feed */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('home.community_activity')}</h2>
            <p className="text-gray-500">{t('home.community_activity_desc')}</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentTrades.map((trade, i) => (
              <motion.div 
                key={trade.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4"
              >
                <div className="bg-green-50 w-12 h-12 rounded-full flex items-center justify-center text-green-600 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {trade.sender} <span className="text-gray-400 font-normal">tukar dengan</span> {trade.receiver}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Barang: <span className="font-semibold text-brand-600">{trade.item_title}</span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-2">
                    {new Date(trade.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
