import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Shield, Navigation, Info, ArrowLeft, Search, Filter, Crosshair, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../utils/api';

// Fix for Leaflet default icon issue in Vite/React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom User Icon
const UserIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

interface Location {
  id: number;
  name: string;
  address: string;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

interface Review {
  id: number;
  username: string;
  avatar: string;
  rating: number;
  comment: string;
  created_at: string;
}

// Helper to calculate distance in km
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Component to handle map center changes
const ChangeView: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  if (center && center[0] != null && center[1] != null) {
    map.setView(center, 14);
  }
  return null;
};

export const SafeZones: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.1951, 106.8231]); // Default to Jakarta
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  
  const markerRefs = React.useRef<{ [key: number]: L.Marker | null }>({});

  useEffect(() => {
    apiFetch('/api/locations')
      .then(res => res.json())
      .then(data => {
        setLocations(data);
        const firstValid = data.find((l: Location) => l.latitude != null && l.longitude != null);
        if (firstValid) {
          setSelectedLocation(firstValid);
          setMapCenter([firstValid.latitude, firstValid.longitude]);
        }
      });

    // Get User Geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => console.error("Geolocation error:", error)
      );
    }
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      apiFetch(`/api/locations/${selectedLocation.id}/reviews`)
        .then(res => res.json())
        .then(setReviews);
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (selectedLocation && markerRefs.current[selectedLocation.id]) {
      markerRefs.current[selectedLocation.id]?.openPopup();
    }
  }, [selectedLocation]);

  const filteredLocations = useMemo(() => {
    let result = locations.map(loc => {
      if (userLocation) {
        return {
          ...loc,
          distance: getDistance(userLocation[0], userLocation[1], loc.latitude, loc.longitude)
        };
      }
      return loc;
    });

    if (searchQuery) {
      result = result.filter(loc => 
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        loc.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      result = result.filter(loc => loc.type === filterType);
    }

    // Sort by distance if user location is available
    if (userLocation) {
      result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return result;
  }, [locations, searchQuery, filterType, userLocation]);

  const handleLocationSelect = (loc: Location) => {
    setSelectedLocation(loc);
    if (loc.latitude != null && loc.longitude != null) {
      setMapCenter([loc.latitude, loc.longitude]);
    }
  };

  const openDirections = (loc: Location) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`;
    window.open(url, '_blank');
  };

  const findNearest = () => {
    if (userLocation && filteredLocations.length > 0) {
      const nearest = filteredLocations[0];
      handleLocationSelect(nearest);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedLocation) return;

    try {
      const res = await apiFetch(`/api/locations/${selectedLocation.id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          rating: newReview.rating,
          comment: newReview.comment
        })
      });

      if (res.ok) {
        setIsReviewModalOpen(false);
        setNewReview({ rating: 5, comment: '' });
        // Refresh reviews
        const revRes = await apiFetch(`/api/locations/${selectedLocation.id}/reviews`);
        setReviews(await revRes.json());
      }
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-[1000]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('home')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-600" />
              Safe Zones
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={findNearest}
              disabled={!userLocation}
              className="flex items-center gap-2 text-xs font-bold text-brand-600 bg-brand-50 px-4 py-2 rounded-full border border-brand-100 hover:bg-brand-100 transition-all disabled:opacity-50"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Terdekat</span>
            </button>
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <Info className="w-3.5 h-3.5" />
              <span>Titik temu resmi yang diverifikasi admin</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar - Location List */}
        <aside className="w-full lg:w-96 bg-white border-r border-gray-100 overflow-y-auto order-2 lg:order-1 flex flex-col">
          <div className="p-6 space-y-6 flex-1">
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-gray-900">Lokasi Terverifikasi</h2>
                <p className="text-sm text-gray-500">Pilih lokasi aman untuk melakukan barter fisik dengan tenang.</p>
              </div>

              {/* Search & Filter */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Cari lokasi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {['all', 'public', 'partner', 'premium'].map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all ${
                        filterType === type 
                          ? 'bg-gray-900 text-white border-gray-900' 
                          : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              {filteredLocations.length > 0 ? filteredLocations.map((loc) => (
                <div
                  key={loc.id}
                  onClick={() => handleLocationSelect(loc)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedLocation?.id === loc.id 
                      ? 'border-brand-600 bg-brand-50/50 shadow-sm' 
                      : 'border-gray-100 hover:border-brand-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        loc.type === 'premium' ? 'bg-purple-100 text-purple-700' :
                        loc.type === 'partner' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {loc.type}
                      </span>
                      {loc.distance != null && (
                        <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                          {loc.distance < 1 ? `${(loc.distance * 1000).toFixed(0)}m` : `${loc.distance.toFixed(1)}km`}
                        </span>
                      )}
                    </div>
                    <MapPin className={`w-4 h-4 ${selectedLocation?.id === loc.id ? 'text-brand-600' : 'text-gray-300'}`} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{loc.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{loc.address}</p>
                  
                  {selectedLocation?.id === loc.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-brand-100 space-y-4"
                    >
                      <p className="text-xs text-brand-700 font-medium leading-relaxed">
                        {loc.description}
                      </p>
                      
                      {/* Reviews Preview */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ulasan Pengguna</h4>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsReviewModalOpen(true);
                            }}
                            className="text-[10px] font-bold text-brand-600 hover:underline"
                          >
                            Tulis Ulasan
                          </button>
                        </div>
                        <div className="space-y-2">
                          {reviews.slice(0, 2).map(rev => (
                            <div key={rev.id} className="bg-white p-2 rounded-xl border border-gray-50">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                  <img src={rev.avatar} className="w-4 h-4 rounded-full" alt="" />
                                  <span className="text-[10px] font-bold text-gray-700">{rev.username}</span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                                  <span className="text-[10px] font-bold text-gray-500">{rev.rating}</span>
                                </div>
                              </div>
                              <p className="text-[10px] text-gray-500 line-clamp-1 italic">"{rev.comment}"</p>
                            </div>
                          ))}
                          {reviews.length === 0 && <p className="text-[10px] text-gray-400 italic">Belum ada ulasan.</p>}
                        </div>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          openDirections(loc);
                        }}
                        className="w-full py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Petunjuk Arah
                      </button>
                    </motion.div>
                  )}
                </div>
              )) : (
                <div className="text-center py-12">
                  <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Lokasi tidak ditemukan.</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Map View */}
        <main className="flex-1 relative order-1 lg:order-2 h-[400px] lg:h-auto">
          <MapContainer 
            center={mapCenter} 
            zoom={14} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ChangeView center={mapCenter} />
            
            {/* User Location Marker */}
            {userLocation && (
              <>
                <Marker position={userLocation} icon={UserIcon}>
                  <Popup>Posisi Kamu</Popup>
                </Marker>
                <Circle 
                  center={userLocation} 
                  radius={500} 
                  pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.1, color: '#3b82f6', weight: 1 }} 
                />
              </>
            )}

            {locations.filter(loc => loc.latitude != null && loc.longitude != null).map((loc) => (
              <Marker 
                key={loc.id} 
                position={[loc.latitude, loc.longitude]}
                ref={(el) => (markerRefs.current[loc.id] = el)}
                eventHandlers={{
                  click: () => handleLocationSelect(loc),
                }}
              >
                <Popup>
                  <div className="p-1">
                    <h4 className="font-bold text-gray-900">{loc.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{loc.address}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Floating Map Controls */}
          <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
            <div className="bg-white p-2 rounded-2xl shadow-xl border border-gray-100 flex flex-col">
              <button className="p-3 hover:bg-gray-50 rounded-xl text-gray-600 transition-colors border-b border-gray-50">+</button>
              <button className="p-3 hover:bg-gray-50 rounded-xl text-gray-600 transition-colors">-</button>
            </div>
          </div>
        </main>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Tulis Ulasan</h3>
                <p className="text-sm text-gray-500">Bagikan pengalaman barter kamu di {selectedLocation?.name}</p>
              </div>
              
              <form onSubmit={handleSubmitReview} className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="p-1"
                      >
                        <Star 
                          className={`w-8 h-8 ${
                            star <= newReview.rating 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : 'text-gray-200'
                          } transition-colors`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Komentar</label>
                  <textarea
                    required
                    rows={4}
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Apa yang kamu sukai dari tempat ini?"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
                  >
                    Kirim Ulasan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
