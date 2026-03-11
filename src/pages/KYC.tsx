import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Upload, CheckCircle2, AlertCircle, ArrowLeft, Camera } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../utils/api';

export const KYC: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [idImage, setIdImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'selfie') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'id') setIdImage(reader.result as string);
        else setSelfieImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!user || !idImage || !selfieImage) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch('/api/kyc/request', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          id_image_url: idImage,
          selfie_image_url: selfieImage
        })
      });
      if (res.ok) {
        setIsSuccess(true);
      }
    } catch (error) {
      console.error("KYC submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Permintaan Terkirim!</h1>
        <p className="text-gray-500">Tim kami akan meninjau dokumen kamu dalam waktu 1-2 hari kerja. Kamu akan menerima notifikasi jika verifikasi selesai.</p>
        <button 
          onClick={() => onNavigate('home')}
          className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-100"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <button 
        onClick={() => onNavigate('home')}
        className="flex items-center gap-2 text-gray-500 font-medium mb-8 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Kembali
      </button>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
        <div className="p-8 md:p-12 space-y-8">
          <div className="flex items-center gap-4">
            <div className="bg-brand-50 p-3 rounded-2xl">
              <Shield className="w-8 h-8 text-brand-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Verifikasi Identitas</h1>
              <p className="text-sm text-gray-500">Lengkapi KYC untuk mendapatkan badge terverifikasi dan akses Safe Zone premium.</p>
            </div>
          </div>

          {/* Steps */}
          <div className="flex items-center gap-4">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s ? 'bg-brand-600 text-white' : 
                  step > s ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                <div className={`flex-1 h-1 rounded-full ${step > s ? 'bg-green-500' : 'bg-gray-100'}`} />
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-blue-50 p-4 rounded-2xl flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Pastikan foto KTP/ID kamu terlihat jelas, tidak buram, dan semua informasi dapat terbaca dengan baik.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900">Foto KTP / Kartu Identitas</h3>
                  <div className="relative aspect-[1.6/1] bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden group">
                    {idImage ? (
                      <img src={idImage} className="w-full h-full object-cover" alt="ID Preview" />
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-300 mb-2 group-hover:text-brand-500 transition-colors" />
                        <p className="text-xs text-gray-400">Klik untuk unggah foto ID</p>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'id')}
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>
                </div>

                <button 
                  disabled={!idImage}
                  onClick={() => setStep(2)}
                  className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-100 disabled:opacity-50"
                >
                  Lanjut ke Langkah 2
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-blue-50 p-4 rounded-2xl flex gap-3">
                  <Camera className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Ambil foto selfie sambil memegang KTP kamu. Pastikan wajah dan KTP terlihat jelas dalam satu frame.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900">Foto Selfie dengan ID</h3>
                  <div className="relative aspect-square bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden group">
                    {selfieImage ? (
                      <img src={selfieImage} className="w-full h-full object-cover" alt="Selfie Preview" />
                    ) : (
                      <>
                        <Camera className="w-10 h-10 text-gray-300 mb-2 group-hover:text-brand-500 transition-colors" />
                        <p className="text-xs text-gray-400">Klik untuk ambil foto selfie</p>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      capture="user"
                      onChange={(e) => handleImageUpload(e, 'selfie')}
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold"
                  >
                    Kembali
                  </button>
                  <button 
                    disabled={!selfieImage}
                    onClick={() => setStep(3)}
                    className="flex-1 py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-100 disabled:opacity-50"
                  >
                    Lanjut
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900">Konfirmasi Data</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Foto ID</p>
                      <img src={idImage!} className="w-full aspect-[1.6/1] object-cover rounded-xl border border-gray-100" alt="" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Foto Selfie</p>
                      <img src={selfieImage!} className="w-full aspect-square object-cover rounded-xl border border-gray-100" alt="" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" id="terms" className="mt-1 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                    <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed">
                      Saya menyatakan bahwa dokumen yang saya unggah adalah asli dan milik saya sendiri. Saya setuju dengan syarat dan ketentuan verifikasi TukeranYuk!
                    </label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep(2)}
                    className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold"
                  >
                    Kembali
                  </button>
                  <button 
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                    className="flex-1 py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-100 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        Kirim Verifikasi
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
