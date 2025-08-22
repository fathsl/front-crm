import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      "nav.home": "Home",
      "nav.dashboard": "Dashboard",
      "nav.profile": "Profile",
      "nav.settings": "Settings",
      "nav.logout": "Logout",
      
      // Login page
      "login.title": "Welcome Back",
      "login.subtitle": "Sign in to your account",
      "login.email": "Email",
      "login.password": "Password",
      "login.submit": "Sign In",
      "login.forgot": "Forgot password?",
      
      // Sidebar
      "sidebar.menu": "Menu",
      "sidebar.overview": "Overview",
      "sidebar.analytics": "Analytics",
      "sidebar.users": "Users",
      "sidebar.reports": "Reports",
      
      // Common
      "common.welcome": "Welcome",
      "common.loading": "Loading...",
      "common.save": "Save",
      "common.cancel": "Cancel",
      "common.delete": "Delete",
      "common.edit": "Edit",
    }
  },
  tr: {
    translation: {
      // Navigation
      "nav.home": "Ana Sayfa",
      "nav.dashboard": "Kontrol Paneli",
      "nav.profile": "Profil",
      "nav.settings": "Ayarlar",
      "nav.logout": "Çıkış Yap",
      
      // Login page
      "login.title": "Tekrar Hoş Geldiniz",
      "login.subtitle": "Hesabınıza giriş yapın",
      "login.email": "E-posta",
      "login.password": "Şifre",
      "login.submit": "Giriş Yap",
      "login.forgot": "Şifrenizi mi unuttunuz?",
      
      // Sidebar
      "sidebar.menu": "Menü",
      "sidebar.overview": "Genel Bakış",
      "sidebar.analytics": "Analitik",
      "sidebar.users": "Kullanıcılar",
      "sidebar.reports": "Raporlar",
      
      // Common
      "common.welcome": "Hoş Geldiniz",
      "common.loading": "Yükleniyor...",
      "common.save": "Kaydet",
      "common.cancel": "İptal",
      "common.delete": "Sil",
      "common.edit": "Düzenle",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
