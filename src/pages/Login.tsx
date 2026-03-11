import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, ArrowRight, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      onNavigate('home');
    } catch (err: any) {
      setError(err.message || 'Gagal login. Silakan periksa email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100"
      >
        {/* Left Side: Form */}
        <div className="flex-1 p-8 md:p-12 space-y-8 relative">
          <button 
            onClick={() => onNavigate('home')}
            className="absolute top-6 left-6 p-2 text-gray-400 hover:text-gray-600 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Masuk ke TukeranYuk</h1>
            <p className="text-gray-500">Temukan barang impianmu lewat barter</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          <div className="space-y-4">
            <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Lanjutkan dengan Google</span>
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-400 font-bold tracking-widest">Atau Masuk Dengan</span>
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

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Password</label>
                <button type="button" className="text-[10px] font-bold text-brand-600 hover:underline">Lupa Password?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <button 
              disabled={isLoading}
              className="w-full bg-brand-600 text-white py-4 rounded-2xl font-bold hover:bg-brand-700 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-brand-100"
            >
              <span>{isLoading ? 'Memproses...' : 'Lanjutkan'}</span>
              {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Belum punya akun? <button onClick={() => onNavigate('register')} className="text-brand-600 font-bold hover:underline">Daftar Sekarang</button>
            </p>
          </div>

          <div className="pt-8 text-center">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Dengan masuk, kamu menyetujui <button className="underline">Syarat & Ketentuan</button> serta <button className="underline">Kebijakan Privasi</button> TukeranYuk.
            </p>
          </div>
        </div>

        {/* Right Side: Promo */}
        <div className="hidden md:flex w-1/3 bg-brand-50 relative overflow-hidden flex-col items-center justify-center p-12 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-100 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-200 rounded-full -ml-32 -mb-32 blur-3xl opacity-50"></div>
          
          <div className="relative space-y-8">
            <div className="bg-white p-6 rounded-3xl shadow-xl inline-block rotate-3">
              <img src="/logo_tukeranyuk.png" alt="Logo" className="h-16 w-auto" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">Barter Aman, Hati Tenang!</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Bergabunglah dengan 12.000+ pengguna yang sudah sukses melakukan barter barang impian mereka.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-white/50">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                <span className="text-xs font-bold text-gray-700">Verifikasi AI Terpercaya</span>
              </div>
              <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-white/50">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                <span className="text-xs font-bold text-gray-700">Titik Temu Aman</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
