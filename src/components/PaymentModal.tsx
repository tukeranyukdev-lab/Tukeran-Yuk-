import React, { useState } from 'react';
import { X, CreditCard, Shield, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { motion, AnimatePresence } from 'motion/react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  userId: number;
  onSuccess: (newBalance: number) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, amount, userId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'confirm' | 'processing' | 'success' | 'error'>('confirm');
  const [error, setError] = useState('');

  const handlePayment = async () => {
    setLoading(true);
    setStep('processing');
    setError('');

    try {
      // 1. Create Payment Intent
      const res = await apiFetch('/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ amount, user_id: userId })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Gagal membuat pembayaran');

      // 2. Simulate or Real Confirm
      // In a real app, we would use Stripe Elements here.
      // For this demo, we simulate the client-side confirmation.
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

      const confirmRes = await apiFetch('/api/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({ 
          payment_intent_id: data.clientSecret === 'mock_secret' ? `pi_mock_${Date.now()}` : data.clientSecret.split('_secret')[0], 
          user_id: userId 
        })
      });

      const confirmData = await confirmRes.json();

      if (confirmRes.ok) {
        setStep('success');
        onSuccess(confirmData.new_balance);
      } else {
        throw new Error(confirmData.error || 'Gagal konfirmasi pembayaran');
      }
    } catch (err: any) {
      setError(err.message);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-gray-900">Top Up Saldo Escrow</h3>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {step === 'confirm' && (
              <div className="space-y-6">
                <div className="bg-brand-50 p-6 rounded-3xl border border-brand-100 text-center">
                  <p className="text-sm text-brand-600 font-bold uppercase tracking-widest mb-1">Total Pembayaran</p>
                  <p className="text-4xl font-bold text-brand-900">Rp {amount.toLocaleString()}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Kartu Kredit / Debit</p>
                      <p className="text-[10px] text-gray-500">Dikelola aman oleh Stripe</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 justify-center">
                    <Shield className="w-3 h-3" />
                    <span>Pembayaran Terenkripsi & Aman</span>
                  </div>
                </div>

                <button 
                  onClick={handlePayment}
                  className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
                >
                  Bayar Sekarang
                </button>
              </div>
            )}

            {step === 'processing' && (
              <div className="py-12 text-center space-y-4">
                <div className="relative inline-block">
                  <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
                </div>
                <h4 className="text-lg font-bold text-gray-900">Memproses Pembayaran</h4>
                <p className="text-sm text-gray-500">Mohon tunggu sebentar, kami sedang mengamankan transaksi kamu...</p>
              </div>
            )}

            {step === 'success' && (
              <div className="py-12 text-center space-y-6">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h4>
                  <p className="text-sm text-gray-500">Saldo escrow kamu telah ditambahkan. Kamu bisa lanjut bertransaksi sekarang.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
                >
                  Selesai
                </button>
              </div>
            )}

            {step === 'error' && (
              <div className="py-12 text-center space-y-6">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Pembayaran Gagal</h4>
                  <p className="text-sm text-gray-500">{error || 'Terjadi kesalahan saat memproses pembayaran.'}</p>
                </div>
                <button 
                  onClick={() => setStep('confirm')}
                  className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all"
                >
                  Coba Lagi
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
