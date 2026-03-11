import React, { useEffect, useState } from 'react';
import { Search, Filter, SlidersHorizontal, MapPin, Star } from 'lucide-react';
import { ItemCard } from '../components/ItemCard';
import { Item } from '../types';
import { usePreferences } from '../hooks/usePreferences';
import { apiFetch } from '../utils/api';

export const Marketplace: React.FC<{ onNavigate: (page: string, id?: number) => void }> = ({ onNavigate }) => {
  const { t } = usePreferences();
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [location, setLocation] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [minValue, setMinValue] = useState<number | ''>('');
  const [maxValue, setMaxValue] = useState<number | ''>('');
  const [condition, setCondition] = useState('Semua');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    apiFetch('/api/items')
      .then(res => res.json())
      .then(data => setItems(data));
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                         item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'Semua' || item.category === category;
    const matchesLocation = !location || item.location.toLowerCase().includes(location.toLowerCase());
    const matchesRating = (item.owner_rating || 0) >= minRating;
    const matchesMinValue = minValue === '' || item.estimated_value >= minValue;
    const matchesMaxValue = maxValue === '' || item.estimated_value <= maxValue;
    const matchesCondition = condition === 'Semua' || item.condition === condition;
    
    return matchesSearch && matchesCategory && matchesLocation && matchesRating && matchesMinValue && matchesMaxValue && matchesCondition;
  });

  const categories = ['Semua', 'Gadget', 'Kamera', 'Hobi', 'Elektronik', 'Kendaraan', 'Furniture'];
  const conditions = ['Semua', 'Baru', 'Seperti Baru', 'Bekas Bagus', 'Bekas'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className={`w-full lg:w-64 space-y-8 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">{t('marketplace.category')}</h3>
            <div className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    category === cat 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">{t('marketplace.location')}</h3>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder={t('marketplace.location')}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Rentang Nilai (Rp)</h3>
            <div className="flex gap-2">
              <input 
                type="number"
                placeholder="Min"
                value={minValue}
                onChange={(e) => setMinValue(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-1/2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input 
                type="number"
                placeholder="Max"
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-1/2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Kondisi Barang</h3>
            <div className="space-y-1">
              {conditions.map(cond => (
                <button
                  key={cond}
                  onClick={() => setCondition(cond)}
                  className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    condition === cond 
                      ? 'bg-brand-50 text-brand-600 border border-brand-100' 
                      : 'text-gray-500 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">{t('marketplace.rating')}</h3>
            <div className="space-y-2">
              {[4, 3, 2, 1].map(rating => (
                <button
                  key={rating}
                  onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                  className={`w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    minRating === rating 
                      ? 'bg-brand-50 text-brand-600 border border-brand-100' 
                      : 'text-gray-500 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span>{rating}+ Bintang</span>
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => {
              setCategory('Semua');
              setLocation('');
              setMinRating(0);
              setSearch('');
            }}
            className="w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
          >
            {t('marketplace.reset')}
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder={t('marketplace.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center justify-center gap-2 bg-white border border-gray-200 px-6 py-3 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span>{showFilters ? t('common.cancel') : 'Filter'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">
              {t('marketplace.showing')} <span className="text-gray-900 font-bold">{filteredItems.length}</span> {t('marketplace.items')}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span>{t('marketplace.sort')}:</span>
              <select className="bg-transparent text-gray-900 outline-none cursor-pointer">
                <option>{t('marketplace.latest')}</option>
                <option>{t('marketplace.highest')}</option>
                <option>{t('marketplace.lowest')}</option>
              </select>
            </div>
          </div>

          {filteredItems.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map(item => (
                <ItemCard key={item.id} item={item} onClick={(id) => onNavigate('item-details', id)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t('marketplace.not_found')}</h3>
              <p className="text-gray-500">{t('marketplace.not_found_desc')}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
