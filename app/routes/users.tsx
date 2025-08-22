import { useAtomValue } from 'jotai';
import { Edit2, Mail, MessageCircle, Phone, Plus, Save, Search, Shield, Trash2, UserIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '~/help';
import { Role } from '~/help';
import { userAtom } from '~/utils/userAtom';

export default function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [chatDrawer, setChatDrawer] = useState({ isOpen: false, user: null });
  const currentUser = useAtomValue(userAtom);
  const [formData, setFormData] = useState({
    userId: 0,
    firstName: '',
    lastName: '',
    kullaniciAdi: '',
    email: '',
    telefon: '',
    password: '',
    durum: 'Aktif',
    yetkiTuru: Role.Yonetici
  });

  const openChatDrawer = (user: any) => {
    setChatDrawer({ isOpen: true, user  });
  };
  
  const closeChatDrawer = () => {
    setChatDrawer({ isOpen: false, user: null });
  };

  const baseUrl = "http://localhost:5178";
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/User`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        console.log("userrss",data);
        
        setFilteredUsers(data);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (err) {
      setError('Kullanıcılar yüklenirken hata oluştu');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    if (!query.trim()) {
      setFilteredUsers(users);
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/api/User/search?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setFilteredUsers(data);
      }
    } catch (err) {
      console.error('Search error:', err);
      const filtered = users.filter(user => 
        user.kullaniciAdi.toLowerCase().includes(query.toLowerCase()) ||
        user.firstName.toLowerCase().includes(query.toLowerCase()) ||
        user.lastName.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.telefon.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const createUser = async (userData: User) => {
    try {
      const response = await fetch(`${baseUrl}/api/User`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (response.ok) {
        await fetchUsers();
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.message };
      }
    } catch (err) {
      return { success: false, message: 'Kullanıcı oluşturulurken hata oluştu' };
    }
  };

  const updateUser = async (userId: number, userData: User) => {
    try {
      const response = await fetch(`${baseUrl}/api/User/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (response.ok) {
        await fetchUsers();
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.message };
      }
    } catch (err) {
      return { success: false, message: 'Kullanıcı güncellenirken hata oluştu' };
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/api/User/${userId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchUsers();
        alert('Kullanıcı başarıyla silindi');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Kullanıcı silinirken hata oluştu');
      }
    } catch (err) {
      alert('Kullanıcı silinirken hata oluştu');
    }
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.kullaniciAdi || !formData.email) {
      alert('Lütfen zorunlu alanları doldurun');
      return;
    }
    
    if (modalMode === 'add' && !formData.password) {
      alert('Şifre alanı zorunludur');
      return;
    }
    
    let result;
    if (modalMode === 'add') {
      result = await createUser(formData);
    } else {
      result = await updateUser(selectedUser?.userId || 0 , formData);
    }

    if (result.success) {
      setShowModal(false);
      resetForm();
      alert(modalMode === 'add' ? 'Kullanıcı başarıyla oluşturuldu' : 'Kullanıcı başarıyla güncellendi');
    } else {
      alert(result.message);
    }
  };

  const resetForm = () => {
    setFormData({
      userId: 0,
      kullaniciAdi: '',
      firstName: '',
      lastName: '',
      email: '',
      telefon: '',
      password: '',
      durum: 'Aktif',
      yetkiTuru: Role.Yonetici
    });
    setSelectedUser(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalMode('add');
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      userId: user.userId || 0,
      kullaniciAdi: user.kullaniciAdi || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      telefon: user.telefon || '',
      password: '',
      durum: user.durum || 'Aktif',
      yetkiTuru: user.yetkiTuru
    });
    setModalMode('edit');
    setShowModal(true);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aktif': return 'bg-green-100 text-green-800';
      case 'Pasif': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: Role) => {    
    switch (role) {
      case Role.Yonetici: return 'bg-purple-100 text-purple-800';
      case Role.Temsilci: return 'bg-blue-100 text-blue-800';
      case Role.Muhasebe: return 'bg-blue-100 text-blue-800';
      case Role.Fabrika: return 'bg-blue-100 text-blue-800';
      case Role.Logistik: return 'bg-blue-100 text-blue-800';
      case Role.Gozlemci: return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header - Mobile Optimized */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">
                Kullanıcı Yönetimi
              </h1>
              <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                Sistem kullanıcılarını yönetin
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Yeni Kullanıcı</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-4 sm:gap-6">
            {filteredUsers.map((user) => (
              <>
              <div key={user.userId} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                      {user.fullName}
                    </h3>
                    <p className="text-xs text-gray-500">@{user.kullaniciAdi}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(user)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteUser(user.userId)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openChatDrawer(user)}
                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Sohbet Et"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{user.telefon}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.durum)}`}>
                    {user.durum}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.yetkiTuru)}`}>
                    <Shield className="h-3 w-3 inline mr-1" />
                    {user.yetkiTuru}
                  </span>
                </div>
              </div>
            </div>
            </>
            ))}
          </div>
        )}

        {!loading && !error && filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Kullanıcı bulunamadı</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Arama kriterlerinize uygun kullanıcı bulunamadı' : 'Henüz kullanıcı eklenmemiş'}
            </p>
            {!searchTerm && (
              <button
                onClick={openAddModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                İlk kullanıcıyı ekle
              </button>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-t-lg sm:rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {modalMode === 'add' ? 'Yeni Kullanıcı Ekle' : 'Kullanıcı Düzenle'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={formData.kullaniciAdi}
                  onChange={(e) => setFormData({...formData, kullaniciAdi: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              
              {modalMode === 'add' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.telefon}
                  onChange={(e) => setFormData({...formData, telefon: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.durum}
                    onChange={(e) => setFormData({...formData, durum: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Pasif">Pasif</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.yetkiTuru}
                    onChange={(e) => setFormData({...formData, yetkiTuru: Number(e.target.value) as Role})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value={Role.Yonetici}>Yonetici</option>
                    <option value={Role.Temsilci}>Temsilci</option>
                    <option value={Role.Muhasebe}>Muhasebe</option>
                    <option value={Role.Fabrika}>Fabrika</option>
                    <option value={Role.Logistik}>Logistik</option>
                    <option value={Role.Gozlemci}>Gozlemci</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {modalMode === 'add' ? 'Add' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
