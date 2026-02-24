import React from 'react';
import { MapPin, ShieldCheck, Star } from 'lucide-react';
import { Item } from '../types';
import { motion } from 'motion/react';

interface ItemCardProps {
  item: Item;
  onClick: (id: number) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onClick }) => {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onClick(item.id)}
    >
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
        <div className="absolute bottom-3 right-3">
          <div className="bg-brand-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            Est. Rp {item.estimated_value.toLocaleString('id-ID')}
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">{item.category}</span>
        </div>
        <h3 className="font-bold text-gray-900 line-clamp-1 mb-2 group-hover:text-brand-600 transition-colors">{item.title}</h3>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <img src={item.owner_avatar} className="w-6 h-6 rounded-full" alt="" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-gray-900 leading-none">{item.owner_name}</span>
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
