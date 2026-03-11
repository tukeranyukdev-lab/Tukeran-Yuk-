import React, { useState } from 'react';
import { MapPin, ShieldCheck, Star, Heart, Crown } from 'lucide-react';
import { Item } from '../types';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../utils/api';

interface ItemCardProps {
  item: Item;
  onClick: (id: number) => void;
  isWishlisted?: boolean;
  onWishlistToggle?: (id: number) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onClick, isWishlisted, onWishlistToggle }) => {
  const { user } = useAuth();
  const [wishlisted, setWishlisted] = useState(isWishlisted);

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    const method = wishlisted ? 'DELETE' : 'POST';
    apiFetch('/api/wishlist', {
      method,
      body: JSON.stringify({ user_id: user.id, item_id: item.id })
    }).then(res => {
      if (res.ok) {
        setWishlisted(!wishlisted);
        if (onWishlistToggle) onWishlistToggle(item.id);
      }
    });
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={`bg-white rounded-2xl overflow-hidden border ${item.is_premium ? 'border-brand-200 shadow-brand-50' : 'border-gray-100 shadow-sm'} hover:shadow-md transition-all cursor-pointer group relative`}
      onClick={() => onClick(item.id)}
    >
      {item.is_premium === 1 && (
        <div className="absolute top-3 right-3 z-10 bg-brand-600 text-white p-1.5 rounded-full shadow-lg">
          <Crown className="w-3.5 h-3.5" />
        </div>
      )}
      
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={item.image_url || `https://picsum.photos/seed/${item.id}/400/300`} 
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-700 shadow-sm">
            {item.condition}
          </span>
        </div>
        
        <button 
          onClick={handleWishlist}
          className={`absolute bottom-3 left-3 p-2 rounded-full backdrop-blur transition-all ${wishlisted ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-400 hover:text-red-500'}`}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
        </button>

        <div className="absolute bottom-3 right-3">
          <div className="bg-brand-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            Est. Rp {item.estimated_value.toLocaleString('id-ID')}
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">{item.category}</span>
          {item.is_premium === 1 && (
            <span className="text-[9px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded uppercase tracking-widest">Premium</span>
          )}
        </div>
        <h3 className="font-bold text-gray-900 line-clamp-1 mb-2 group-hover:text-brand-600 transition-colors">{item.title}</h3>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <img src={item.owner_avatar} className="w-6 h-6 rounded-full" alt="" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-gray-900 leading-none">{item.owner_name}</span>
                {item.is_premium === 1 && <Crown className="w-2 h-2 text-brand-600" />}
              </div>
              <div className="flex items-center gap-0.5 mt-0.5">
                <Star className="w-2 h-2 text-yellow-400 fill-yellow-400" />
                <span className="text-[8px] text-gray-500 font-medium">{item.owner_rating || 5.0}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <MapPin className="w-3 h-3" />
            <span className="text-[10px] font-medium">{item.location}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
