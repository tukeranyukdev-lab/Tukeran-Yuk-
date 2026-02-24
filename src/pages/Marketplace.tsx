import React, { useEffect, useState } from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { ItemCard } from '../components/ItemCard';
import { Item } from '../types';

export const Marketplace: React.FC<{ onNavigate: (page: string, id?: number) => void }> = ({ onNavigate }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');

  useEffect(() => {
    fetch('/api/items')
      .then(res => res.json())
      .then(data => setItems(data));
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                         item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'Semua' || item.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Semua', 'Gadget', 'Kamera', 'Hobi', 'Elektronik', 'Kendaraan', 'Furniture'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 space-y-8">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Kategori</h3>
            <div className="space-y-2">
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
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Kondisi</h3>
            <div className="space-y-2">
              {['Baru', 'Seperti Baru', 'Bekas Bagus', 'Bekas'].map(cond => (
                <label key={cond} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">{cond}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari barang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <button className="flex items-center justify-center gap-2 bg-white border border-gray-200 px-6 py-3 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all">
              <SlidersHorizontal className="w-5 h-5" />
              <span>Filter</span>
            </button>
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">Barang tidak ditemukan</h3>
              <p className="text-gray-500">Coba gunakan kata kunci lain atau filter yang berbeda.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
