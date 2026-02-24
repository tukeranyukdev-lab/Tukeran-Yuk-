import React from 'react';
import { motion } from 'motion/react';
import { Shield, Info, Scale, Lock, HelpCircle, MessageSquare, MapPin } from 'lucide-react';

interface StaticPageProps {
  type: string;
  onNavigate: (page: string) => void;
}

export const StaticPage: React.FC<StaticPageProps> = ({ type, onNavigate }) => {
  const getContent = () => {
    switch (type) {
      case 'how-it-works':
        return {
          title: 'Cara Kerja TukeranYuk',
          icon: <Info className="w-12 h-12 text-brand-600" />,
          content: (
            <div className="space-y-6">
              <p>TukeranYuk adalah platform barter modern yang memudahkan Anda menukar barang yang sudah tidak terpakai dengan barang yang Anda butuhkan.</p>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="font-bold text-brand-600 mb-2">1. Pasang Barang</div>
                  <p className="text-sm text-gray-500">Foto barang Anda, berikan deskripsi lengkap, dan tentukan barang apa yang Anda cari sebagai gantinya.</p>
                </div>
                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="font-bold text-brand-600 mb-2">2. Ajukan Barter</div>
                  <p className="text-sm text-gray-500">Cari barang di marketplace dan ajukan penawaran. Anda bisa menawarkan 1 barang, beberapa barang, atau tambahan uang.</p>
                </div>
                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="font-bold text-brand-600 mb-2">3. Ketemuan & Tukar</div>
                  <p className="text-sm text-gray-500">Setelah setuju, pilih Titik Temu Resmi kami untuk melakukan penukaran dengan aman dan nyaman.</p>
                </div>
              </div>
            </div>
          )
        };
      case 'meeting-points':
        return {
          title: 'Titik Temu Resmi',
          icon: <MapPin className="w-12 h-12 text-brand-600" />,
          content: (
            <div className="space-y-6">
              <p>Kami bekerja sama dengan berbagai lokasi strategis untuk memastikan transaksi barter Anda berjalan aman.</p>
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-xl border border-gray-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold">Starbucks Reserve Dewata</h4>
                    <p className="text-sm text-gray-500">Bali, Indonesia</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Tersedia</span>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold">Grand Indonesia - West Mall Lobby</h4>
                    <p className="text-sm text-gray-500">Jakarta Pusat</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Tersedia</span>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold">Tunjungan Plaza 6 - Atrium</h4>
                    <p className="text-sm text-gray-500">Surabaya</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Tersedia</span>
                </div>
              </div>
            </div>
          )
        };
      case 'safe-zone':
        return {
          title: 'SBM Safe Zone',
          icon: <Shield className="w-12 h-12 text-brand-600" />,
          content: (
            <div className="space-y-6">
              <p>SBM (Secure Barter Marketplace) Safe Zone adalah fasilitas fisik premium kami yang dilengkapi dengan petugas keamanan dan alat verifikasi barang.</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Dilengkapi CCTV 24 jam.</li>
                <li>Petugas verifikasi untuk membantu cek keaslian barang elektronik dan luxury.</li>
                <li>Ruang tunggu yang nyaman dengan akses Wi-Fi gratis.</li>
                <li>Layanan escrow untuk barter yang melibatkan tambahan uang tunai.</li>
              </ul>
            </div>
          )
        };
      case 'help-center':
        return {
          title: 'Pusat Bantuan',
          icon: <HelpCircle className="w-12 h-12 text-brand-600" />,
          content: (
            <div className="space-y-6">
              <p>Punya pertanyaan? Kami siap membantu Anda.</p>
              <div className="grid gap-4">
                <details className="p-4 bg-white rounded-xl border border-gray-100 cursor-pointer">
                  <summary className="font-bold">Bagaimana cara membatalkan penawaran?</summary>
                  <p className="mt-2 text-sm text-gray-500">Anda dapat membatalkan penawaran melalui Dashboard &gt; Penawaran Saya sebelum pihak lain menyetujui.</p>
                </details>
                <details className="p-4 bg-white rounded-xl border border-gray-100 cursor-pointer">
                  <summary className="font-bold">Apakah ada biaya transaksi?</summary>
                  <p className="mt-2 text-sm text-gray-500">Barter dasar 1:1 adalah gratis. Biaya hanya dikenakan jika Anda menggunakan layanan SBM Safe Zone Premium atau layanan verifikasi ahli.</p>
                </details>
              </div>
            </div>
          )
        };
      case 'community-rules':
        return {
          title: 'Aturan Komunitas',
          icon: <Scale className="w-12 h-12 text-brand-600" />,
          content: (
            <div className="space-y-6">
              <p>Untuk menjaga ekosistem yang sehat, harap patuhi aturan berikut:</p>
              <ul className="list-decimal pl-6 space-y-2 text-gray-600">
                <li>Dilarang menawarkan barang ilegal atau berbahaya.</li>
                <li>Berikan deskripsi barang yang jujur dan apa adanya.</li>
                <li>Hargai pengguna lain dalam berkomunikasi.</li>
                <li>Gunakan Titik Temu Resmi untuk keamanan Anda sendiri.</li>
              </ul>
            </div>
          )
        };
      case 'security':
        return {
          title: 'Keamanan',
          icon: <Lock className="w-12 h-12 text-brand-600" />,
          content: (
            <div className="space-y-6">
              <p>Keamanan Anda adalah prioritas utama kami.</p>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="p-6 bg-brand-50 rounded-2xl border border-brand-100">
                  <h4 className="font-bold text-brand-900 mb-2">Verifikasi Identitas</h4>
                  <p className="text-sm text-brand-800">Setiap pengguna wajib melakukan verifikasi KTP/ID untuk dapat melakukan transaksi barter.</p>
                </div>
                <div className="p-6 bg-brand-50 rounded-2xl border border-brand-100">
                  <h4 className="font-bold text-brand-900 mb-2">Sistem Rating</h4>
                  <p className="text-sm text-brand-800">Rating diberikan setelah transaksi selesai untuk membangun reputasi komunitas yang terpercaya.</p>
                </div>
              </div>
            </div>
          )
        };
      case 'contact':
        return {
          title: 'Hubungi Kami',
          icon: <MessageSquare className="w-12 h-12 text-brand-600" />,
          content: (
            <div className="space-y-6">
              <p>Kami senang mendengar dari Anda. Hubungi tim kami melalui saluran berikut:</p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
                  <div className="bg-gray-100 p-2 rounded-lg">📧</div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Email</p>
                    <p className="font-medium">support@tukeranyuk.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
                  <div className="bg-gray-100 p-2 rounded-lg">📱</div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">WhatsApp</p>
                    <p className="font-medium">+62 812-3456-7890</p>
                  </div>
                </div>
              </div>
            </div>
          )
        };
      case 'privacy':
        return {
          title: 'Kebijakan Privasi',
          icon: <Lock className="w-12 h-12 text-brand-600" />,
          content: (
            <div className="space-y-6 text-gray-600 leading-relaxed">
              <p>Kebijakan Privasi ini menjelaskan bagaimana TukeranYuk mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda.</p>
              <h4 className="font-bold text-gray-900">1. Informasi yang Kami Kumpulkan</h4>
              <p>Kami mengumpulkan informasi yang Anda berikan saat mendaftar, seperti nama, email, dan data verifikasi identitas.</p>
              <h4 className="font-bold text-gray-900">2. Penggunaan Informasi</h4>
              <p>Informasi Anda digunakan untuk memproses transaksi, memverifikasi akun, dan meningkatkan layanan kami.</p>
              <h4 className="font-bold text-gray-900">3. Keamanan Data</h4>
              <p>Kami menggunakan enkripsi standar industri untuk melindungi data Anda dari akses yang tidak sah.</p>
            </div>
          )
        };
      case 'terms':
        return {
          title: 'Syarat & Ketentuan',
          icon: <Scale className="w-12 h-12 text-brand-600" />,
          content: (
            <div className="space-y-6 text-gray-600 leading-relaxed">
              <p>Dengan menggunakan TukeranYuk, Anda menyetujui syarat dan ketentuan berikut:</p>
              <h4 className="font-bold text-gray-900">1. Kelayakan Pengguna</h4>
              <p>Anda harus berusia minimal 18 tahun atau memiliki izin orang tua untuk menggunakan platform ini.</p>
              <h4 className="font-bold text-gray-900">2. Tanggung Jawab Barang</h4>
              <p>TukeranYuk tidak bertanggung jawab atas kondisi barang yang dibarter. Pengguna wajib memeriksa barang saat pertemuan.</p>
              <h4 className="font-bold text-gray-900">3. Pembatalan Transaksi</h4>
              <p>Transaksi dapat dibatalkan oleh salah satu pihak sebelum barang berpindah tangan di titik temu.</p>
            </div>
          )
        };
      default:
        return {
          title: 'Halaman Tidak Ditemukan',
          icon: <Info className="w-12 h-12 text-gray-400" />,
          content: <p>Maaf, halaman yang Anda cari tidak tersedia.</p>
        };
    }
  };

  const { title, icon, content } = getContent();

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">{icon}</div>
          <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
          <div className="w-20 h-1.5 bg-brand-600 mx-auto rounded-full" />
        </div>

        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-gray-100">
          {content}
        </div>

        <div className="text-center">
          <button 
            onClick={() => onNavigate('home')}
            className="text-brand-600 font-bold hover:underline"
          >
            Kembali ke Beranda
          </button>
        </div>
      </motion.div>
    </div>
  );
};
