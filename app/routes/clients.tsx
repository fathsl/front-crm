import { useAtomValue } from 'jotai';
import { Edit2, Mail, Phone, Plus, Save, Search, Shield, Trash2, UserIcon, X, MapPin, Info, Home, FileText, MessageSquare, Calendar, EyeIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Role, type Client, type Project } from '~/help';
import { userAtom, type User } from '~/utils/userAtom';
import { countries } from '~/data/countries';
import { useNavigate } from 'react-router';

interface ExtendedClient extends Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  details: string;
  createdAt: Date;
  modifiedAt: Date;
  createdBy: number;
  modifiedBy: number;
  imageUrl: string;
  zipCode: string;
  VATNumber: string;
  address: string;
  city: string;
}

export default function Clients() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects,setProjects] = useState<Project[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [usersById, setUsersById] = useState<Record<string, any>>({});
  const currentUser = useAtomValue<User | null>(userAtom);
  const [formData, setFormData] = useState<Omit<ExtendedClient, 'id'> & { city?: string; address?: string; file?: File; }>({
    first_name: '',
    last_name: '',
    details: '',
    country: '',
    phone: '',
    email: '',
    createdAt: new Date(),
    modifiedAt: new Date(),
    createdBy: 0,
    modifiedBy: 0,
    imageUrl: '',
    zipCode: '',
    VATNumber: '',
    address: '',
    city: '',
  });

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedClient(null);
  };

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

  const getUserById = async (userId: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/User/${userId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("User fetch error:", error);
    }
    return null;
  };

  const fetchClientUsers = async (clientsList: any[]) => {
    try {
      const createdByIds = [...new Set(clientsList.map(c => c.createdBy))];
      const users = await Promise.all(
        createdByIds.map(async (id) => {
          const user = await getUserById(id);
          return user ? [id, user] : null;
        })
      );
    
      const userMap = Object.fromEntries(users.filter(Boolean) as [string, any][]);
      setUsersById(userMap);
    } catch (err) {
      console.error("Error fetching users for clients:", err);
    }
  };
  
  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (clients.length > 0) {
      fetchClientUsers(clients);
    }
  }, [clients]);

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
      const formData = new FormData();
     
      formData.append('First_name', clientData.first_name);
      formData.append('Last_name', clientData.last_name);
      formData.append('Phone', clientData.phone || '');
      formData.append('Email', clientData.email);
      formData.append('Details', clientData.details || '');
      formData.append('Country', clientData.country || '');
      formData.append('City', clientData.city || '');
      formData.append('Address', clientData.address || '');
      formData.append('ZipCode', clientData.zipCode || '');
      formData.append('VATNumber', clientData.VATNumber || '');
      formData.append('CreatedBy', clientData.createdBy?.toString() || '1');
     
      if (clientData.file) {
        formData.append('file', clientData.file);
      }

      const baseUrl = 'http://localhost:5178'; 
 
      const response = await fetch(`${baseUrl}/api/Clients`, {
        method: 'POST',
        body: formData,
        headers: {
        }
      });
     
      if (response.ok) {
        const result = await response.json();
        await fetchClients();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        return { success: false, message: errorData.message || 'Server error occurred' };
      }
    } catch (err) {
      console.error('Network error:', err);
      return { success: false, message: 'Kullanıcı oluşturulurken hata oluştu - Network error' };
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    
    if (!formData.first_name || !formData.last_name || !formData.email) {
      alert('Lütfen zorunlu alanları doldurun');
      return;
    }
   
    const currentUserId = currentUser?.userId || 1; 
    const clientData: Client = {
      ...formData,
      id: selectedClient?.id || 0,
      createdBy: modalMode === 'add' ? currentUserId : (formData.createdBy || currentUserId),
      modifiedBy: currentUserId,
      modifiedAt: new Date(),
      createdAt: modalMode === 'add' ? new Date() : (formData.createdAt || new Date())
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
      alert(result.message || 'An error occurred');
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
      modifiedAt: new Date(),
      createdBy: 0,
      modifiedBy: 0,
      imageUrl: '',
      zipCode: '',
      VATNumber: ''
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
      modifiedAt: new Date(clientData.modifiedAt),
      createdBy: clientData.createdBy,
      modifiedBy: clientData.modifiedBy,
      imageUrl: clientData.imageUrl,
      zipCode: clientData.zipCode,
      VATNumber: clientData.VATNumber,
      address: clientData.address,
      city: clientData.city
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
      <div className="space-y-4 p-4">
       <div className="grid gap-4">
         {filteredClients.map((client) => (
           <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-300">
             <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center overflow-hidden">
                   {client.imageUrl ? (
                     <img 
                       src={client.imageUrl} 
                       alt={`${client.first_name} ${client.last_name}`} 
                       className="w-full h-full object-cover" 
                     />
                   ) : (
                     <UserIcon className="h-6 w-6 text-indigo-600" />
                   )}
                 </div>
                 <div>
                   <h3 className="font-semibold text-gray-900 text-lg">
                     {client.first_name} {client.last_name}
                   </h3>
                   <p className="text-sm text-gray-500">ID: #{client.id}</p>
                 </div>
               </div>

               <div className="flex items-center gap-2">
                  <button
                     onClick={() => navigate(`/clients/${client.id}`)}
                     className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                     title="View Details"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>

                 <button
                   onClick={() => openEditModalHandler(client)}
                   className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                   title="Edit Client"
                 >
                   <Edit2 className="h-4 w-4" />
                 </button>
                 <button
                   onClick={() => deleteClient(client.id)}
                   className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                   title="Delete Client"
                 >
                   <Trash2 className="h-4 w-4" />
                 </button>
               </div>
             </div>
 
             <div className="grid md:grid-cols-2 gap-4 mb-4">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                   <Mail className="h-4 w-4 text-gray-600" />
                 </div>
                 <div>
                   <p className="text-sm font-medium text-gray-900">{client.email}</p>
                   <p className="text-xs text-gray-500">Email</p>
                 </div>
               </div>
               
               {client.phone && (
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                     <Phone className="h-4 w-4 text-gray-600" />
                   </div>
                   <div>
                     <p className="text-sm font-medium text-gray-900">{client.phone}</p>
                     <p className="text-xs text-gray-500">Phone</p>
                   </div>
                 </div>
               )}
             </div>
 
             {(client.city || client.country || client.address) && (
               <div className="grid md:grid-cols-2 gap-4 mb-4">
                 {(client.city || client.country) && (
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                       <MapPin className="h-4 w-4 text-gray-600" />
                     </div>
                     <div>
                       <p className="text-sm font-medium text-gray-900">
                         {[client.city, client.country].filter(Boolean).join(', ')}
                       </p>
                       <p className="text-xs text-gray-500">Location</p>
                     </div>
                   </div>
                 )}
                 
                 {client.address && (
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                       <Home className="h-4 w-4 text-gray-600" />
                     </div>
                     <div>
                       <p className="text-sm font-medium text-gray-900">
                         {client.address} {client.zipCode && `(${client.zipCode})`}
                       </p>
                       <p className="text-xs text-gray-500">Address</p>
                     </div>
                   </div>
                 )}
               </div>
             )}
 
             <div className="flex items-center justify-between pt-4 border-t border-gray-100">
               <div className="flex items-center gap-6">
                 {client.VATNumber && (
                   <div className="flex items-center gap-2">
                     <FileText className="h-4 w-4 text-gray-400" />
                     <span className="text-sm text-gray-600">VAT: {client.VATNumber}</span>
                   </div>
                 )}
                 
                 <div className="flex items-center gap-2">
                   <Calendar className="h-4 w-4 text-gray-400" />
                   <span className="text-sm text-gray-600">
                     Created {new Date(client.createdAt).toLocaleDateString('en-US', {
                       month: 'short',
                       day: 'numeric',
                       year: 'numeric'
                     })}
                   </span>
                 </div>
               </div>
               
               <div className="text-right">
                 <p className="text-sm text-gray-600">Created by</p>
                 <p className="text-sm font-medium text-gray-900">{usersById[client.createdBy]?.fullName ?? "Unknown User"}</p>
               </div>
             </div>
           </div>
         ))}
       </div>
 
       {isDetailsModalOpen && selectedClient && (
         <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
             <div className="flex items-center justify-between p-6 border-b border-gray-200">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center">
                   {selectedClient.imageUrl ? (
                     <img 
                       src={selectedClient.imageUrl} 
                       alt={`${selectedClient.first_name} ${selectedClient.last_name}`} 
                       className="w-full h-full object-cover rounded-full" 
                     />
                   ) : (
                     <UserIcon className="h-5 w-5 text-indigo-600" />
                   )}
                 </div>
                 <div>
                   <h2 className="text-xl font-semibold text-gray-900">
                     {selectedClient.first_name} {selectedClient.last_name}
                   </h2>
                   <p className="text-sm text-gray-500">Client Details</p>
                 </div>
               </div>
               <button
                 onClick={closeDetailsModal}
                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
               >
                 <X className="h-5 w-5 text-gray-500" />
               </button>
             </div>
             
             <div className="p-6">
               <div className="flex items-start gap-3">
                 <MessageSquare className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                 <div>
                   <h3 className="font-medium text-gray-900 mb-2">Additional Details</h3>
                   <p className="text-gray-700 leading-relaxed">{selectedClient.details}</p>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}
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
      <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
      <div className="bg-white rounded-l-2xl w-full max-w-md h-full overflow-y-auto">
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
                placeholder="Enter last name"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
                placeholder="Enter phone number"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
              >
                <option value="">Select a country</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
                placeholder="Enter city"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
                placeholder="Enter full address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zip Code
              </label>
              <input
                type="text"
                value={formData.zipCode || ''}
                onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
                placeholder="Enter zip code"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VAT Number
              </label>
              <input
                type="text"
                value={formData.VATNumber || ''}
                onChange={(e) => setFormData({...formData, VATNumber: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
                placeholder="Enter VAT number"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Image
            </label>
            <div className="flex items-center space-x-4">
              {formData.imageUrl && (
                <img 
                  src={formData.imageUrl} 
                  alt="Client preview" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({...formData, file, imageUrl: URL.createObjectURL(file)});
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-shadow duration-200 hover:shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Details
            </label>
            <textarea
              rows={4}
              value={formData.details}
              onChange={(e) => setFormData({...formData, details: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
              placeholder="Additional information about the client..."
            />
          </div>
          
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors duration-200 hover:shadow"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center justify-center gap-2 transition-colors duration-200 hover:shadow"
            >
              <Save className="h-4 w-4" />
              {modalMode === 'add' ? 'Add' : 'Update'}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
    )}
    </div>
  );
}