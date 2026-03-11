import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../utils/api';
import { io, Socket } from 'socket.io-client';
import { Send, Image as ImageIcon, ArrowLeft, MoreVertical, Search, User as UserIcon, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playNotificationSound } from '../utils/notifications';

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  image_url?: string;
  is_read: number;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

interface Conversation {
  id: number;
  user1_id: number;
  user2_id: number;
  item_id: number | null;
  user1_name: string;
  user1_avatar: string;
  user2_name: string;
  user2_avatar: string;
  item_title: string | null;
  item_image: string | null;
  created_at: string;
}

export const Messages: React.FC<{ onNavigate: (page: string, id?: number) => void; initialConversationId?: number | null }> = ({ onNavigate, initialConversationId }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState<{ id: number, username: string } | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      onNavigate('login');
      return;
    }

    // Fetch conversations
    apiFetch(`/api/conversations/user/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setConversations(data);
        if (initialConversationId) {
          const found = data.find((c: Conversation) => c.id === initialConversationId);
          if (found) setActiveConversation(found);
        }
      });

    // Setup Socket
    const newSocket = io();
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, initialConversationId]);

  useEffect(() => {
    if (activeConversation && socket) {
      // Join room
      socket.emit('join_conversation', activeConversation.id);

      // Fetch message history
      apiFetch(`/api/messages/${activeConversation.id}`)
        .then(res => res.json())
        .then(setMessages);

      // Listen for new messages
      const handleNewMessage = (msg: Message) => {
        if (msg.conversation_id === activeConversation.id) {
          setMessages(prev => [...prev, msg]);
          if (msg.sender_id !== user.id) {
            playNotificationSound();
            // Mark as read immediately if active
            socket.emit('mark_as_read', { conversation_id: activeConversation.id, user_id: user.id });
          }
        }
      };

      const handleMessagesRead = (data: { conversation_id: number, user_id: number }) => {
        if (data.conversation_id === activeConversation.id && data.user_id !== user.id) {
          setMessages(prev => prev.map(m => ({ ...m, is_read: 1 })));
        }
      };

      const handleUserTyping = (data: { conversation_id: number, user_id: number, username: string }) => {
        if (data.conversation_id === activeConversation.id) {
          setOtherUserTyping({ id: data.user_id, username: data.username });
        }
      };

      const handleUserStopTyping = (data: { conversation_id: number, user_id: number }) => {
        if (data.conversation_id === activeConversation.id) {
          setOtherUserTyping(null);
        }
      };

      socket.on('new_message', handleNewMessage);
      socket.on('messages_read', handleMessagesRead);
      socket.on('user_typing', handleUserTyping);
      socket.on('user_stop_typing', handleUserStopTyping);

      // Initial mark as read
      socket.emit('mark_as_read', { conversation_id: activeConversation.id, user_id: user.id });

      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('messages_read', handleMessagesRead);
        socket.off('user_typing', handleUserTyping);
        socket.off('user_stop_typing', handleUserStopTyping);
      };
    }
  }, [activeConversation, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent, imageUrl?: string) => {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && !imageUrl) || !activeConversation || !socket || !user) return;

    const messageData = {
      conversation_id: activeConversation.id,
      sender_id: user.id,
      content: newMessage.trim(),
      image_url: imageUrl
    };

    socket.emit('send_message', messageData);
    setNewMessage('');
    
    // Stop typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit('stop_typing', { conversation_id: activeConversation.id, user_id: user.id });
      setIsTyping(false);
    }
  };

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const compressed = await compressImage(base64String);
      handleSendMessage(null as any, compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!socket || !activeConversation || !user) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { conversation_id: activeConversation.id, user_id: user.id, username: user.username });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { conversation_id: activeConversation.id, user_id: user.id });
      setIsTyping(false);
    }, 3000);
  };

  const getOtherUser = (conv: Conversation) => {
    if (!user) return { name: '', avatar: '' };
    return conv.user1_id === user.id 
      ? { name: conv.user2_name, avatar: conv.user2_avatar }
      : { name: conv.user1_name, avatar: conv.user1_avatar };
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-120px)]">
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden h-full flex">
        
        {/* Sidebar: Conversations List */}
        <div className={`w-full lg:w-80 border-r border-gray-100 flex flex-col ${activeConversation ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pesan</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari percakapan..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length > 0 ? (
              conversations.map(conv => {
                const other = getOtherUser(conv);
                return (
                  <div 
                    key={conv.id}
                    onClick={() => setActiveConversation(conv)}
                    className={`p-4 flex items-center gap-3 cursor-pointer transition-all hover:bg-gray-50 ${activeConversation?.id === conv.id ? 'bg-brand-50 border-r-4 border-brand-600' : ''}`}
                  >
                    <img src={other.avatar} className="w-12 h-12 rounded-full border border-gray-100" alt="" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-900 truncate">{other.name}</h4>
                        <span className="text-[10px] text-gray-400">12:45</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {conv.item_title ? `Barter: ${conv.item_title}` : 'Klik untuk mengobrol'}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500">Belum ada percakapan.</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Chat Window */}
        <div className={`flex-1 flex flex-col bg-gray-50/30 ${!activeConversation ? 'hidden lg:flex items-center justify-center' : 'flex'}`}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveConversation(null)}
                    className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <img src={getOtherUser(activeConversation).avatar} className="w-10 h-10 rounded-full border border-gray-100" alt="" />
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{getOtherUser(activeConversation).name}</h4>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Online</span>
                    </div>
                  </div>
                </div>
                
                {activeConversation.item_title && (
                  <div 
                    onClick={() => onNavigate('item-details', activeConversation.item_id!)}
                    className="hidden sm:flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-all"
                  >
                    <img src={activeConversation.item_image!} className="w-8 h-8 rounded-lg object-cover" alt="" />
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Barter Barang</p>
                      <p className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{activeConversation.item_title}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, i) => {
                  const isMe = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] space-y-1`}>
                        <div className={`p-4 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white text-gray-900 rounded-tl-none border border-gray-100'}`}>
                          {msg.image_url && (
                            <img src={msg.image_url} className="max-w-full rounded-lg mb-2 border border-white/20" alt="Sent" />
                          )}
                          {msg.content}
                        </div>
                        <div className={`flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <p className="text-[10px] text-gray-400">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {isMe && (
                            msg.is_read ? (
                              <CheckCheck className="w-3 h-3 text-blue-500" />
                            ) : (
                              <Check className="w-3 h-3 text-gray-400" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {otherUserTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
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
                    onChange={handleTyping}
                    placeholder="Tulis pesan..."
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
                <MessageCircle className="w-10 h-10 text-brand-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pilih Percakapan</h3>
              <p className="text-gray-500 max-w-xs mx-auto">Pilih salah satu percakapan di sebelah kiri untuk mulai mengobrol.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

const MessageCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
);
