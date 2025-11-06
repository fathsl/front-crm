import { useAtomValue } from "jotai";
import { Calendar, Edit2, Eye, Package, PlusIcon, SearchIcon, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AddCategoryDrawer } from "~/components/AddCategoryDrawer";
import { AddComponentModal } from "~/components/AddComponentModal";
import type { Category, Component, User } from "~/help";
import { userAtom } from "~/utils/userAtom";

const CategoriesPage = () => {
  const { t } = useTranslation();
  const currentUser = useAtomValue(userAtom) as unknown as User;
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [componentsByCategories, setComponentsByCategories] = useState<Component[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [componentsLoading, setComponentsLoading] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [componentModal, setComponentModal] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const baseUrl = "https://api-crm-tegd.onrender.com";

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${baseUrl}/api/Categories`);
      if (!response.ok) throw new Error('Kategoriler yüklenemedi');
      const data = await response.json();
      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      setError('Kategoriler yüklenirken bir hata oluştu');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/User`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);        
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

  const fetchComponentsByCategories = async (categoryId: number) => {
    try {
      setComponentsLoading(true);
      setError('');
      const response = await fetch(`${baseUrl}/api/Bilesen/ByCategory/${categoryId}`);
      if (!response.ok) throw new Error('Bileşenler yüklenemedi');
      const data = await response.json();
      setComponentsByCategories(data);
    } catch (error) {
      setError('Bileşenler yüklenirken bir hata oluştu');
      console.error(error);
    } finally {
      setComponentsLoading(false);
    }
  };

  const fetchComponents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${baseUrl}/api/Bilesen`);
      if (!response.ok) throw new Error('Bileşenler yüklenemedi');
      const data = await response.json();
      setComponents(data);
    } catch (error) {
      setError('Bileşenler yüklenirken bir hata oluştu');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchComponents();
    fetchUsers();
  }, []);

  const openComponentModal = async (category: Category) => {
    setSelectedCategory(category);
    await fetchComponentsByCategories(category.kategoriID);
    setComponentModal(true);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setFilteredCategories(categories);
      return;
    }
    const searchLower = value.toLowerCase();
    const filtered = categories.filter(category =>
      category.kategoriAdi?.toLowerCase().includes(searchLower) ||
      category.fiyat?.toString().includes(searchLower) ||
      category.stok?.toString().includes(searchLower)
    );
    setFilteredCategories(filtered);
  };

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (id: number) => {
    if (window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`${baseUrl}/api/Categories/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Silme başarısız');
        setCategories(categories.filter(c => c.kategoriID !== id));
        setFilteredCategories(filteredCategories.filter(c => c.kategoriID !== id));
      } catch (error) {
        setError('Kategori silinirken bir hata oluştu');
      }
    }
  };

  const formatDate = (dateString: Date) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(value);
  };

  const handleComponentSubmit = (component: Component, isEdit: boolean) => {
    if (isEdit) {
      setComponentsByCategories(prev =>
        prev.map(c => c.bilesenID === component.bilesenID ? component : c)
      );
    } else {
      setComponentsByCategories(prev => [...prev, component]);
    }

    setComponentModal(false);
    setEditingComponent(null);
  };

  const handleCategorySuccess = () => {
    fetchCategories();
    setShowCategoryModal(false);
  };

  const getUserNameById = (userId: number | undefined) => {
    if (!userId || userId === 0) return 'Unknown';
    
    const user = users.find(u => u.userId === userId);
    if (!user) return 'Unknown';
    
    return `${user.fullName}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="bg-white shadow-sm">
        <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Categories</h1>
              <p className="mt-1 text-sm text-gray-500">Categories Yönetim Sayfası</p>
            </div>
            <button
              onClick={() => {
                handleAddCategory();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Yeni Kategori</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Toplantı ara..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Kategori bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Arama kriterlerinize uygun kategori bulunamadı' : 'Henüz kategori eklenmemiş'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
            {filteredCategories.map((category) => (
              <div
              key={category.kategoriID}
              className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200 overflow-hidden flex flex-col"
            >
              <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={category.kategoriAdi}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.style.display = 'flex';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <Package className="h-16 w-16 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500 font-medium">No Image</span>
                  </div>
                )}
                
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="p-2 bg-white/90 backdrop-blur-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shadow-sm"
                    title="Düzenle"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.kategoriID)}
                    className="p-2 bg-white/90 backdrop-blur-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-sm"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 sm:px-6 py-3 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  {category.kategoriAdi || 'N/A'}
                </h3>
              </div>

              <div className="px-4 sm:px-6 py-3 sm:py-4 flex-1 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">Fiyat</span>
                  <span className="text-sm sm:text-base font-semibold text-blue-600">
                    {formatCurrency(category.fiyat || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">Stok</span>
                  <span className={`px-2 py-1 text-xs sm:text-sm font-semibold rounded-full ${
                    category.stok === null || category.stok === undefined ? 'bg-gray-100 text-gray-700' :
                    category.stok > 10 ? 'bg-green-100 text-green-700' :
                    category.stok > 0 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {category.stok !== null && category.stok !== undefined ? category.stok : 'N/A'}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created by: {getUserNameById(category.createdBy)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(category.createdAt || new Date())}
                  </p>
                </div>

                {category.updatedAt !== category.createdAt && (
                  <div className="text-xs text-gray-500">
                    {category.updatedBy && (
                      <p>Updated by: {getUserNameById(category.updatedBy)}</p>
                    )}
                    {category.updatedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(category.updatedAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => openComponentModal(category)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>Add Components</span>
                </button>
              </div>
            </div>
            ))}
          </div>
          </div>
        )}
      </div>

      {componentModal && (
        <AddComponentModal
          category={selectedCategory}
          componentsByCategories={componentsByCategories}
          components={components}
          onClose={() => {
            setComponentModal(false);
            setComponents([]);
            setSelectedCategory(null);
          }}
          onSubmit={handleComponentSubmit}
        />
      )}

      {showCategoryModal && (
        <AddCategoryDrawer
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          category={selectedCategory}
          currentUserId={currentUser.userId}
          onSuccess={handleCategorySuccess}
        />
      )}
    </div>
  );
  };

export default CategoriesPage;