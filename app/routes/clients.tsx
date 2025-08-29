import { useAtomValue } from 'jotai';
import { Edit2, Mail, Phone, Plus, Save, Search, Shield, Trash2, UserIcon, X, MapPin, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Role, type Client, type Project } from '~/help';
import { userAtom, type User } from '~/utils/userAtom';
import { countries } from '~/data/countries';

// Extend the Client interface to include all required fields
interface ExtendedClient extends Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  details: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
  updatedBy: number;
}

export default function Clients() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects,setProjects] = useState<Project[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const currentUser = useAtomValue<User | null>(userAtom);
  const [formData, setFormData] = useState<Omit<ExtendedClient, 'id'> & { city?: string; address?: string }>({
    first_name: '',
    last_name: '',
    details: '',
    country: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 0,
    updatedBy: 0
  });

  const baseUrl = "http://localhost:5178";
  
  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/Clients`);
      if (response.ok) {
        const data = await response.json();
        setClients(data);
        
        setFilteredClients(data);
      } else {
        throw new Error('Failed to fetch clients');
      }
    } catch (err) {
      setError('Kullanıcılar yüklenirken hata oluştu');
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:5178/api/Project');
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Projects fetch error:', error);
      }
    };
  
    useEffect(() => {
      fetchProjects();
    }, []);

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    if (!query.trim()) {
      setFilteredClients(clients);
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/api/Clients/search?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setFilteredClients(data);
      }
    } catch (err) {
      console.error('Search error:', err);
      const filtered = clients.filter(client => 
        client.country.toLowerCase().includes(query.toLowerCase()) ||
        client.phone.toLowerCase().includes(query.toLowerCase()) ||
        client.email.toLowerCase().includes(query.toLowerCase()) ||
        client.last_name.toLowerCase().includes(query.toLowerCase()) ||
        client.first_name.toLowerCase().includes(query.toLowerCase()) ||
        client.details.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  };

  const createClient = async (clientData: Client) => {
    try {
      const response = await fetch(`${baseUrl}/api/Clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
      
      if (response.ok) {
        await fetchClients();
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.message };
      }
    } catch (err) {
      return { success: false, message: 'Kullanıcı oluşturulurken hata oluştu' };
    }
  };

  const updateClient = async (clientId: number, userData: Client) => {
    try {
      const response = await fetch(`${baseUrl}/api/Clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (response.ok) {
        await fetchClients();
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.message };
      }
    } catch (err) {
      return { success: false, message: 'Kullanıcı güncellenirken hata oluştu' };
    }
  };

  const deleteClient = async (clientId: number) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/api/Clients/${clientId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchClients();
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
    if (!formData.first_name || !formData.last_name || !formData.email) {
      alert('Lütfen zorunlu alanları doldurun');
      return;
    }
    
    const currentUserId = currentUser?.userId || 0;
    const clientData: ExtendedClient = {
      ...formData,
      id: selectedClient?.id || 0,
      createdBy: modalMode === 'add' ? currentUserId : formData.createdBy,
      updatedBy: currentUserId,
      updatedAt: new Date(),
      ...(modalMode === 'add' && { createdAt: new Date() })
    };
    
    let result;
    if (modalMode === 'add') {
      result = await createClient(clientData);
    } else {
      result = await updateClient(selectedClient?.id || 0, clientData);
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
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      details: '',
      country: '',
      city: '',
      address: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 0,
      updatedBy: 0
    });
    setSelectedClient(null);
  };

  const openEditModal = (client: Client) => {
    const clientData = client as ExtendedClient;
    setSelectedClient(clientData);
    setModalMode('edit');
    setFormData({
      first_name: clientData.first_name,
      last_name: clientData.last_name,
      email: clientData.email,
      phone: clientData.phone || '',
      country: clientData.country || '',
      details: clientData.details || '',
      createdAt: new Date(clientData.createdAt),
      updatedAt: new Date(clientData.updatedAt),
      createdBy: clientData.createdBy,
      updatedBy: clientData.updatedBy
    });
    setShowModal(true);
  };

  const openEditModalHandler = (client: Client) => openEditModal(client);

  const openAddModal = () => {
    resetForm();
    setModalMode('add');
    setShowModal(true);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Clients</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your clients and their information</p>
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
          {filteredClients.map((client) => (
            <>
            <div key={client.id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                    {client.first_name + ' ' + client.last_name}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModalHandler(client)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteClient(client.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{client.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{client.phone}</span>
              </div>
            </div>
          </div>
          </>
          ))}
        </div>
      )}

      {!loading && !error && filteredClients.length === 0 && (
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name *</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                  >
                    <option value="">Select a country</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="text"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="Enter city"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="text"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Enter full address"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Details</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute top-2 left-0 pl-3 flex items-start pointer-events-none">
                    <Info className="h-5 w-5 text-gray-400 mt-0.5" />
                  </div>
                  <textarea
                    rows={3}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.details}
                    onChange={(e) => setFormData({...formData, details: e.target.value})}
                    placeholder="Additional information about the client..."
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t">
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