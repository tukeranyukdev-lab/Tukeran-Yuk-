import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../utils/api';
import { io, Socket } from 'socket.io-client';
import { Send, Image as ImageIcon, ArrowLeft, Search, Users, MapPin, Hash, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playNotificationSound } from '../utils/notifications';

interface Group {
  id: number;
  name: string;
  description: string;
  category: 'location' | 'hobby';
  location: string | null;
  image_url: string;
  created_at: string;
}

interface GroupMessage {
  id: number;
  group_id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar: string;
  content: string;
  image_url?: string;
  created_at: string;
}

export const Community: React.FC<{ onNavigate: (page: string, id?: number) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      onNavigate('login');
      return;
    }

    // Fetch all groups
    apiFetch('/api/community/groups')
      .then(res => res.json())
      .then(setGroups);

    // Fetch my groups
    apiFetch(`/api/community/user/${user.id}/groups`)
      .then(res => res.json())
      .then(setMyGroups);

    // Setup Socket
    const newSocket = io();
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (activeGroup && socket) {
      socket.emit('join_group', activeGroup.id);

      apiFetch(`/api/community/groups/${activeGroup.id}/messages`)
        .then(res => res.json())
        .then(setMessages);

      const handleNewGroupMessage = (msg: GroupMessage) => {
        if (msg.group_id === activeGroup.id) {
          setMessages(prev => [...prev, msg]);
          if (msg.sender_id !== user?.id) {
            playNotificationSound();
          }
        }
      };

      socket.on('new_group_message', handleNewGroupMessage);

      return () => {
        socket.off('new_group_message', handleNewGroupMessage);
      };
    }
  }, [activeGroup, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent, imageUrl?: string) => {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && !imageUrl) || !activeGroup || !socket || !user) return;

    const messageData = {
      group_id: activeGroup.id,
      sender_id: user.id,
      content: newMessage.trim(),
      image_url: imageUrl
    };

    socket.emit('send_group_message', messageData);
    setNewMessage('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      handleSendMessage(null as any, base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleJoinGroup = async (groupId: number) => {
    if (!user) return;
    const res = await apiFetch(`/api/community/groups/${groupId}/join`, {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id })
    });
    if (res.ok) {
      const joinedGroup = groups.find(g => g.id === groupId);
      if (joinedGroup) {
        setMyGroups(prev => [...prev, joinedGroup]);
        setActiveGroup(joinedGroup);
      }
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.description.toLowerCase().includes(search.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-120px)]">
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden h-full flex">
        
        {/* Sidebar: Groups List */}
        <div className={`w-full lg:w-80 border-r border-gray-100 flex flex-col ${activeGroup ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Komunitas</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari grup..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Grup Saya</h3>
              <div className="space-y-2">
                {myGroups.map(group => (
                  <div 
                    key={group.id}
                    onClick={() => setActiveGroup(group)}
                    className={`p-3 flex items-center gap-3 cursor-pointer rounded-2xl transition-all hover:bg-gray-50 ${activeGroup?.id === group.id ? 'bg-brand-50 text-brand-600' : 'text-gray-600'}`}
                  >
                    <div className={`p-2 rounded-xl ${activeGroup?.id === group.id ? 'bg-brand-600 text-white' : 'bg-gray-100'}`}>
                      {group.category === 'location' ? <MapPin className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                    </div>
                    <span className="font-bold text-sm truncate">{group.name}</span>
                  </div>
                ))}
              </div>

              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-8 mb-4">Jelajahi Grup</h3>
              <div className="space-y-4">
                {filteredGroups.filter(g => !myGroups.some(mg => mg.id === g.id)).map(group => (
                  <div key={group.id} className="p-4 bg-gray-50 rounded-3xl border border-gray-100">
                    <img src={group.image_url} className="w-full h-24 object-cover rounded-2xl mb-3" alt="" />
                    <h4 className="font-bold text-gray-900 text-sm mb-1">{group.name}</h4>
                    <p className="text-[10px] text-gray-500 line-clamp-2 mb-3">{group.description}</p>
                    <button 
                      onClick={() => handleJoinGroup(group.id)}
                      className="w-full py-2 bg-white border border-gray-200 text-brand-600 rounded-xl text-xs font-bold hover:bg-brand-50 transition-all"
                    >
                      Gabung Grup
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content: Group Chat Window */}
        <div className={`flex-1 flex flex-col bg-gray-50/30 ${!activeGroup ? 'hidden lg:flex items-center justify-center' : 'flex'}`}>
          {activeGroup ? (
            <>
              {/* Group Header */}
              <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveGroup(null)}
                    className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="p-2.5 bg-brand-600 text-white rounded-2xl">
                    {activeGroup.category === 'location' ? <MapPin className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{activeGroup.name}</h4>
                    <p className="text-[10px] text-gray-400">{activeGroup.description}</p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMe && <img src={msg.sender_avatar} className="w-8 h-8 rounded-full border border-gray-100 self-end" alt="" />}
                      <div className={`max-w-[70%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && <p className="text-[10px] font-bold text-gray-400 ml-1">{msg.sender_name}</p>}
                        <div className={`p-4 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white text-gray-900 rounded-tl-none border border-gray-100'}`}>
                          {msg.image_url && (
                            <img src={msg.image_url} className="max-w-full rounded-lg mb-2 border border-white/20" alt="Sent" />
                          )}
                          {msg.content}
                        </div>
                        <p className={`text-[10px] text-gray-400 ${isMe ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <label className="p-3 text-gray-400 hover:text-brand-600 transition-colors cursor-pointer">
                    <ImageIcon className="w-5 h-5" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tulis pesan ke grup..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-6 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 bg-brand-600 text-white rounded-2xl shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="text-center p-12">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                <Users className="w-10 h-10 text-brand-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pilih Komunitas</h3>
              <p className="text-gray-500 max-w-xs mx-auto">Bergabunglah dengan grup lokal atau hobi untuk menemukan teman barter baru.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
