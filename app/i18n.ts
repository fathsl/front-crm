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

      // Chats / Discussions
      "chats.newDiscussion.title": "New Discussion",
      "chats.newDiscussion.discussionTitle": "Discussion title",
      "chats.newDiscussion.descriptionPlaceholder": "Description (optional)",
      "chats.newDiscussion.clients": "Clients:",
      "chats.newDiscussion.selectClientsPlaceholder": "Select clients...",
      "chats.newDiscussion.searchClientsPlaceholder": "Search clients...",
      "chats.newDiscussion.selectAll": "Select All",
      "chats.newDiscussion.clearAll": "Clear All",
      "chats.newDiscussion.selectClientsHeader": "Select Clients",
      "chats.newDiscussion.noClientsFound": "No clients found for \"{{term}}\"",
      "chats.newDiscussion.noClientsAvailable": "No clients available",
      "chats.newDiscussion.status": "Discussion Status",
      "chats.newDiscussion.status.notStarted": "Not Started",
      "chats.newDiscussion.status.inProgress": "In Progress",
      "chats.newDiscussion.status.completed": "Completed",
      "chats.newDiscussion.create": "Create Discussion",
      "chats.newDiscussion.creating": "Creating...",
      "chats.newDiscussion.cancel": "Cancel",
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

      // Chats / Discussions
      "chats.newDiscussion.title": "Yeni Görüşme",
      "chats.newDiscussion.discussionTitle": "Görüşme başlığı",
      "chats.newDiscussion.descriptionPlaceholder": "Açıklama (opsiyonel)",
      "chats.newDiscussion.clients": "Müşteriler:",
      "chats.newDiscussion.selectClientsPlaceholder": "Müşteri seçin...",
      "chats.newDiscussion.searchClientsPlaceholder": "Müşteri ara...",
      "chats.newDiscussion.selectAll": "Tümünü Seç",
      "chats.newDiscussion.clearAll": "Temizle",
      "chats.newDiscussion.selectClientsHeader": "Müşteri Seçin",
      "chats.newDiscussion.noClientsFound": "\"{{term}}\" için müşteri bulunamadı",
      "chats.newDiscussion.noClientsAvailable": "Müşteri bulunmuyor",
      "chats.newDiscussion.status": "Görüşme Durumu",
      "chats.newDiscussion.status.notStarted": "Başlamadı",
      "chats.newDiscussion.status.inProgress": "Devam Ediyor",
      "chats.newDiscussion.status.completed": "Tamamlandı",
      "chats.newDiscussion.create": "Görüşme Oluştur",
      "chats.newDiscussion.creating": "Oluşturuluyor...",
      "chats.newDiscussion.cancel": "İptal",
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
