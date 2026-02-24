import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email);
      onNavigate('home');
    } catch (err) {
      alert('Gagal login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 space-y-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center mx-auto">
              <img src="/logo_tukeranyuk.png" alt="TukeranYuk Logo" className="h-24 w-auto" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Selamat Datang Kembali</h1>
              <p className="text-sm text-gray-500">Masuk untuk mulai barter dengan aman.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Alamat Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <button 
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-gray-200"
            >
              <span>{isLoading ? 'Memproses...' : 'Masuk Sekarang'}</span>
              {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3 bg-brand-50 p-4 rounded-2xl border border-brand-100">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              <p className="text-[10px] text-brand-800 font-medium leading-relaxed">
                Data kamu aman dan terenkripsi. Kami menggunakan sistem verifikasi OTP untuk keamanan akun.
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-8 text-sm text-gray-500">
          Belum punya akun? <button className="text-brand-600 font-bold hover:underline">Daftar Gratis</button>
        </p>
      </motion.div>
    </div>
  );
};
