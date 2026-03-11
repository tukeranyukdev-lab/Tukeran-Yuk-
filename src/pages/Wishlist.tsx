import React, { useEffect, useState } from 'react';
import { Heart, Search, ArrowLeft } from 'lucide-react';
import { ItemCard } from '../components/ItemCard';
import { Item } from '../types';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../utils/api';
import { motion } from 'motion/react';

export const Wishlist: React.FC<{ onNavigate: (page: string, id?: number) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      apiFetch(`/api/wishlist/${user.id}`)
        .then(res => res.json())
        .then(data => {
          setItems(data);
          setLoading(false);
        });
    }
  }, [user]);

  const handleRemove = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => onNavigate('dashboard')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wishlist Saya</h1>
          <p className="text-gray-500">Barang-barang yang kamu incar untuk barter.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-100 animate-pulse rounded-2xl aspect-[4/5]" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map(item => (
            <ItemCard 
              key={item.id} 
              item={item} 
              onClick={(id) => onNavigate('item-details', id)} 
              isWishlisted={true}
              onWishlistToggle={handleRemove}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-red-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Wishlist masih kosong</h3>
          <p className="text-gray-500 mb-6">Belum ada barang yang kamu simpan.</p>
          <button 
            onClick={() => onNavigate('marketplace')}
            className="bg-brand-600 text-white px-8 py-3 rounded-full font-bold hover:bg-brand-700 transition-all"
          >
            Cari Barang
          </button>
        </div>
      )}
    </div>
  );
};
