import { useAtom } from "jotai";
import { AlertCircle, Camera, CheckCircle, Edit2, Eye, EyeOff, Mail, Phone, Save, Shield, User, UserIcon, X } from "lucide-react";
import { useState } from "react";
import { currUser } from "~/utils/userAtom";

const Profile = () => {
    const [user] = useAtom(currUser);
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [formData, setFormData] = useState({
      KullaniciAdi: user?.userId || '',
      Ad: user?.fullName || '',
      Soyad: user?.role || '',
      Email: user?.email || '',
      Telefon: user?.loginTime || '',
      Sifre: ''
    });
  
    const handleSave = async () => {
      try {
        setShowNotification(true);
        setIsEditing(false);
        
        setTimeout(() => {
          setShowNotification(false);
        }, 3000);
        
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    };
  
    const handleCancel = () => {
      setFormData({
        KullaniciAdi: user?.userId || '',
        Ad: user?.fullName || '',
        Soyad: user?.role || '',
        Email: user?.email || '',
        Telefon: user?.loginTime || '',
        Sifre: ''
      });
      setIsEditing(false);
    };
  
    const getRoleDisplayName = (role: string) => {
      switch(role) {
        case 'Yonetici': return 'Yönetici';
        case 'Moderator': return 'Moderatör';
        case 'Kullanici': return 'Kullanıcı';
        default: return role;
      }
    };
  
    const getRoleBadgeColor = (role: string) => {
      switch(role) {
        case 'Yonetici': return 'bg-red-100 text-red-800 border-red-200';
        case 'Moderator': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Kullanici': return 'bg-green-100 text-green-800 border-green-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };
  
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        {showNotification && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
            <CheckCircle className="w-5 h-5" />
            <span>Profil başarıyla güncellendi!</span>
          </div>
        )}
  
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Profilim</h1>
            <p className="text-gray-600 mt-1">Kişisel bilgilerinizi görüntüleyin ve düzenleyin</p>
          </div>
  
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <UserIcon className="w-12 h-12 md:w-16 md:h-16 text-white" />
                  </div>
                  <button className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
  
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-gray-500 mb-3">@{user?.userId}</p>
                
                <div className="flex justify-center mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(user?.role as string)}`}>
                    <Shield className="w-4 h-4 mr-1" />
                    {getRoleDisplayName(user?.role as string)}
                  </span>
                </div>
  
                <div className="flex items-center justify-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${user?.status === 'Aktif' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-gray-600">Durum: {user?.status}</span>
                </div>
              </div>
            </div>
  
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Kişisel Bilgiler</h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Düzenle</span>
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        <span className="hidden sm:inline">İptal</span>
                        <X className="w-4 h-4 sm:hidden" />
                      </button>
                      <button
                        onClick={handleSave}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        <Save className="w-4 h-4" />
                        <span className="hidden sm:inline">Kaydet</span>
                      </button>
                    </div>
                  )}
                </div>
  
                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Kişisel Bilgiler</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ad
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.Ad}
                            onChange={(e) => setFormData(prev => ({ ...prev, Ad: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          />
                        ) : (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <User className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{user?.firstName}</span>
                          </div>
                        )}
                      </div>
  
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Soyad
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.Soyad}
                            onChange={(e) => setFormData(prev => ({ ...prev, Soyad: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          />
                        ) : (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <User className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{user?.firstName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Hesap Bilgileri</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Kullanıcı Adı
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.KullaniciAdi}
                            onChange={(e) => setFormData(prev => ({ ...prev, KullaniciAdi: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          />
                        ) : (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <User className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">@{user?.userId}</span>
                          </div>
                        )}
                      </div>
  
                      {isEditing && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Yeni Şifre (Boş bırakın değiştirmek istemiyorsanız)
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={formData.Sifre}
                              onChange={(e) => setFormData(prev => ({ ...prev, Sifre: e.target.value }))}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                              placeholder="Yeni şifre girin"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-4">İletişim Bilgileri</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          E-posta
                        </label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={formData.Email}
                            onChange={(e) => setFormData(prev => ({ ...prev, Email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          />
                        ) : (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{user?.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
  
                  <div className="pt-6 border-t">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Hesap Detayları</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Yetki Düzeyi
                        </label>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Shield className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-900">{getRoleDisplayName(user?.role as string)}</span>
                        </div>
                      </div>
  
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hesap Durumu
                        </label>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-2 h-2 rounded-full ${user?.status === 'Aktif' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-gray-900">{user?.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium">Bilgi:</p>
                          <p>Yetki düzeyi ve hesap durumu sadece sistem yöneticileri tarafından değiştirilebilir.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default Profile;