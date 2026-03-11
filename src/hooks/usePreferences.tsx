import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { apiFetch } from '../utils/api';

type Theme = 'light' | 'dark';
type Language = 'id' | 'en';

interface PreferencesContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  id: {
    'nav.marketplace': 'Marketplace',
    'nav.safezones': 'Safe Zones',
    'nav.dashboard': 'Dashboard',
    'nav.login': 'Masuk',
    'nav.post': 'Tuker Barang',
    'nav.search_placeholder': 'Cari barang untuk dibarter...',
    'nav.notifications': 'Notifikasi',
    'nav.messages': 'Pesan',
    'nav.verify': 'Verifikasi Akun',
    'hero.title': 'Tuker Barang Tanpa Ragu.',
    'hero.subtitle': 'Ekosistem barter modern dengan jaminan keamanan, titik temu terverifikasi, dan estimasi nilai berbasis AI.',
    'hero.cta': 'Mulai Barter',
    'hero.how_it_works': 'Cara Kerja',
    'hero.verified_users': 'User Terverifikasi',
    'features.secure.title': 'Aman & Terpercaya',
    'features.secure.desc': 'Verifikasi identitas berlapis dan sistem rating transparan untuk keamanan maksimal.',
    'features.safezones.title': 'Titik Temu Resmi',
    'features.safezones.desc': 'Pilih lokasi pertemuan di mall, cafe partner, atau Safe Zone premium kami.',
    'features.flexible.title': 'Barter Fleksibel',
    'features.flexible.desc': 'Dukung barter 1:1, multi-barang, hingga barter dengan tambahan uang tunai.',
    'home.recent_items': 'Barang Terbaru',
    'home.recent_items_desc': 'Temukan barang impianmu dan ajukan penawaran barter sekarang.',
    'home.view_all': 'Lihat Semua',
    'home.community_activity': 'Aktivitas Komunitas',
    'home.community_activity_desc': 'Barter yang baru saja berhasil di TukeranYuk!',
    'dashboard.title': 'Dashboard Saya',
    'dashboard.proposals': 'Penawaran Barter',
    'dashboard.my_items': 'Barang Saya',
    'dashboard.history': 'Riwayat',
    'dashboard.settings': 'Pengaturan',
    'dashboard.wishlist': 'Wishlist Saya',
    'dashboard.premium_upgrade': 'Upgrade Rp 49rb/bln',
    'dashboard.verified': 'Member Verified',
    'dashboard.not_verified': 'Belum Terverifikasi',
    'dashboard.verify_now': 'Verifikasi Sekarang',
    'dashboard.empty_proposals': 'Belum ada penawaran barter.',
    'dashboard.empty_items': 'Kamu belum memposting barang.',
    'dashboard.empty_history': 'Belum ada riwayat barter yang selesai.',
    'dashboard.history.export': 'Ekspor Data',
    'dashboard.matchmaker.title': 'AI Barter Matchmaker',
    'dashboard.matchmaker.reason': 'Alasan Rekomendasi',
    'dashboard.community.title': 'Komunitas',
    'dashboard.community.join': 'Gabung Grup',
    'dashboard.badges.title': 'Lencana Saya',
    'dashboard.badges.update': 'Perbarui Lencana',
    'settings.language': 'Bahasa / Language',
    'settings.language_desc': 'Pilih bahasa tampilan aplikasi',
    'settings.theme': 'Tema / Theme',
    'settings.theme_desc': 'Ganti antara mode terang dan gelap',
    'settings.mode_light': 'Mode Terang',
    'settings.mode_dark': 'Mode Gelap',
    'common.view': 'Lihat',
    'common.detail': 'Detail',
    'common.cancel': 'Batal',
    'common.save': 'Simpan',
    'common.accept': 'Terima',
    'common.reject': 'Tolak',
    'common.review': 'Beri Ulasan',
    'common.report': 'Laporkan Masalah',
    'footer.desc': 'Platform barter terpercaya di Indonesia. Kami menghubungkan orang-orang untuk bertukar barang dengan aman melalui titik temu resmi dan verifikasi identitas.',
    'footer.help': 'Bantuan',
    'footer.help_center': 'Pusat Bantuan',
    'footer.rules': 'Aturan Komunitas',
    'footer.security': 'Keamanan',
    'footer.contact': 'Hubungi Kami',
    'footer.privacy': 'Kebijakan Privasi',
    'footer.terms': 'Syarat & Ketentuan',
    'footer.copyright': '© 2026 TukeranYuk. Dibuat dengan ❤️ untuk komunitas barter Indonesia.',
    'flash.title': 'Flash Barter!',
    'marketplace.category': 'Kategori',
    'marketplace.location': 'Lokasi',
    'marketplace.rating': 'Rating Penjual',
    'marketplace.reset': 'Reset Semua Filter',
    'marketplace.search': 'Cari barang...',
    'marketplace.showing': 'Menampilkan',
    'marketplace.items': 'barang',
    'marketplace.sort': 'Urutkan',
    'marketplace.latest': 'Terbaru',
    'marketplace.highest': 'Nilai Tertinggi',
    'marketplace.lowest': 'Nilai Terendah',
    'marketplace.not_found': 'Barang tidak ditemukan',
    'marketplace.not_found_desc': 'Coba gunakan kata kunci lain atau filter yang berbeda.',
    'flash.subtitle': 'Event terbatas untuk kategori tertentu.',
    'analytics.views': 'Dilihat',
    'analytics.wishlists': 'Wishlist',
    'escrow.status': 'Status Escrow',
    'escrow.pending': 'Menunggu Pembayaran',
    'escrow.held': 'Dana Ditahan (Aman)',
    'escrow.released': 'Dana Dilepaskan',
    'escrow.refunded': 'Dana Dikembalikan',
    'shipping.method': 'Metode Pengiriman',
    'shipping.address': 'Alamat Pengiriman',
    'shipping.cod': 'COD (Ketemuan)',
    'shipping.gosend': 'GoSend',
    'shipping.grab': 'Grab Express',
    'shipping.jne': 'JNE',
  },
  en: {
    'nav.marketplace': 'Marketplace',
    'nav.safezones': 'Safe Zones',
    'nav.dashboard': 'Dashboard',
    'nav.login': 'Login',
    'nav.post': 'Post Item',
    'nav.search_placeholder': 'Search items to barter...',
    'nav.notifications': 'Notifications',
    'nav.messages': 'Messages',
    'nav.verify': 'Verify Account',
    'hero.title': 'Barter Items Without Doubt.',
    'hero.subtitle': 'Modern barter ecosystem with security guarantees, verified meeting points, and AI-based value estimation.',
    'hero.cta': 'Start Bartering',
    'hero.how_it_works': 'How It Works',
    'hero.verified_users': 'Verified Users',
    'features.secure.title': 'Safe & Trusted',
    'features.secure.desc': 'Multi-layered identity verification and transparent rating system for maximum security.',
    'features.safezones.title': 'Official Meeting Points',
    'features.safezones.desc': 'Choose meeting locations at malls, partner cafes, or our premium Safe Zones.',
    'features.flexible.title': 'Flexible Barter',
    'features.flexible.desc': 'Support 1:1 barter, multi-item, up to barter with additional cash.',
    'home.recent_items': 'Recent Items',
    'home.recent_items_desc': 'Find your dream items and submit barter proposals now.',
    'home.view_all': 'View All',
    'home.community_activity': 'Community Activity',
    'home.community_activity_desc': 'Recently successful barters on TukeranYuk!',
    'dashboard.title': 'My Dashboard',
    'dashboard.proposals': 'Barter Proposals',
    'dashboard.my_items': 'My Items',
    'dashboard.history': 'History',
    'dashboard.settings': 'Settings',
    'dashboard.wishlist': 'My Wishlist',
    'dashboard.premium_upgrade': 'Upgrade IDR 49k/mo',
    'dashboard.verified': 'Verified Member',
    'dashboard.not_verified': 'Not Verified',
    'dashboard.verify_now': 'Verify Now',
    'dashboard.empty_proposals': 'No barter proposals yet.',
    'dashboard.empty_items': 'You haven\'t posted any items yet.',
    'dashboard.empty_history': 'No completed barter history yet.',
    'dashboard.history.export': 'Export Data',
    'dashboard.matchmaker.title': 'AI Barter Matchmaker',
    'dashboard.matchmaker.reason': 'Recommendation Reason',
    'dashboard.community.title': 'Community',
    'dashboard.community.join': 'Join Group',
    'dashboard.badges.title': 'My Badges',
    'dashboard.badges.update': 'Update Badges',
    'settings.language': 'Language',
    'settings.language_desc': 'Choose application display language',
    'settings.theme': 'Theme',
    'settings.theme_desc': 'Switch between light and dark mode',
    'settings.mode_light': 'Light Mode',
    'settings.mode_dark': 'Dark Mode',
    'common.view': 'View',
    'common.detail': 'Detail',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.accept': 'Accept',
    'common.reject': 'Reject',
    'common.review': 'Give Review',
    'common.report': 'Report Issue',
    'footer.desc': 'Trusted barter platform in Indonesia. We connect people to exchange items safely through official meeting points and identity verification.',
    'footer.help': 'Help',
    'footer.help_center': 'Help Center',
    'footer.rules': 'Community Rules',
    'footer.security': 'Security',
    'footer.contact': 'Contact Us',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms & Conditions',
    'footer.copyright': '© 2024 TukeranYuk. Made with ❤️ for the Indonesian barter community.',
    'flash.title': 'Flash Barter!',
    'marketplace.category': 'Category',
    'marketplace.location': 'Location',
    'marketplace.rating': 'Seller Rating',
    'marketplace.reset': 'Reset All Filters',
    'marketplace.search': 'Search items...',
    'marketplace.showing': 'Showing',
    'marketplace.items': 'items',
    'marketplace.sort': 'Sort',
    'marketplace.latest': 'Latest',
    'marketplace.highest': 'Highest Value',
    'marketplace.lowest': 'Lowest Value',
    'marketplace.not_found': 'Items not found',
    'marketplace.not_found_desc': 'Try using other keywords or different filters.',
    'flash.subtitle': 'Limited event for specific categories.',
    'analytics.views': 'Views',
    'analytics.wishlists': 'Wishlists',
    'escrow.status': 'Escrow Status',
    'escrow.pending': 'Awaiting Payment',
    'escrow.held': 'Funds Held (Safe)',
    'escrow.released': 'Funds Released',
    'escrow.refunded': 'Funds Refunded',
    'shipping.method': 'Shipping Method',
    'shipping.address': 'Shipping Address',
    'shipping.cod': 'COD (Meetup)',
    'shipping.gosend': 'GoSend',
    'shipping.grab': 'Grab Express',
    'shipping.jne': 'JNE',
  }
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>((user?.theme as Theme) || 'light');
  const [language, setLang] = useState<Language>((user?.language as Language) || 'id');

  useEffect(() => {
    if (user) {
      setTheme((user.theme as Theme) || 'light');
      setLang((user.language as Language) || 'id');
    }
  }, [user]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (user) {
      await apiFetch(`/api/users/${user.id}/preferences`, {
        method: 'PATCH',
        body: JSON.stringify({ theme: newTheme })
      });
    }
  };

  const setLanguage = async (lang: Language) => {
    setLang(lang);
    if (user) {
      await apiFetch(`/api/users/${user.id}/preferences`, {
        method: 'PATCH',
        body: JSON.stringify({ language: lang })
      });
    }
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <PreferencesContext.Provider value={{ theme, language, toggleTheme, setLanguage, t }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used within PreferencesProvider');
  return context;
};
