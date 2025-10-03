import { useAtomValue } from 'jotai';
import { Edit2, Mail, Phone, Plus, Save, Search, Shield, Trash2, UserIcon, X, MapPin, Info, Home, FileText, MessageSquare, Calendar, EyeIcon, Check, UploadIcon, FileIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DiscussionStatus, Role, type Client, type CreateDiscussionRequest, type Discussion, type Project, type Resource } from '~/help';
import { userAtom, type User } from '~/utils/userAtom';
import { countries } from '~/data/countries';
import { useNavigate } from 'react-router';
import type { DiscussionWithLastTask } from './chats';
import { useMessageToast } from '~/components/ToastNotificationSystem';
import { toast } from 'sonner';

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
  fileUrl: string;
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
  const [resourceDescription, setResourceDescription] = useState('');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [usersById, setUsersById] = useState<Record<string, any>>({});
  const currentUser = useAtomValue<User | null>(userAtom);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [pendingClientId, setPendingClientId] = useState<number | null>(null);
  const [selectedUserForDiscussion, setSelectedUserForDiscussion] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
  const [newDiscussionDescription, setNewDiscussionDescription] = useState('');
  const [isCreatingDiscussion, setIsCreatingDiscussion] = useState(false);
  const [discussions, setDiscussions] = useState<DiscussionWithLastTask[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCreateDiscussion, setShowCreateDiscussion] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState({
    clients: false,
    projects: false,
    resources: false,
    tasks: false,
  });
  const [resourceTitle, setResourceTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isAdmin = (currentUser?.permissionType === 'Yonetici') || (currentUser?.role === 'Yonetici');
  const { showToastForMessage } = useMessageToast(currentUser);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [pendingResources, setPendingResources] = useState<Array<{
    id: string;
    title: string;
    description: string;
    file?: File;
    audioFile?: Blob;
  }>>([]);

  const resourceIdCounter = useRef(0);

  const filterByRole = (list: Client[]) => {
    if (isAdmin) return list;
    const uid = currentUser?.userId ?? -1;
    return list.filter(c => c.createdBy === uid);
  };

  const [formData, setFormData] = useState<Omit<ExtendedClient, 'id'> & { 
    city?: string; 
    address?: string; 
    file?: File;
  }>({
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
    fileUrl: '',
  });

  const baseUrl = "https://api-crm-tegd.onrender.com";

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/Clients`);
      if (response.ok) {
        const data = await response.json();
        setClients(data);
        const visible = filterByRole(data);
        setFilteredClients(visible);
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

  const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${baseUrl}/api/User`);
        if (response.ok) {
          const data = await response.json();
          const filteredUsers = data.filter((user: User) => user.userId !== currentUser?.userId).sort((a: User, b: User) => a.fullName.localeCompare(b.fullName));
          setUsers(filteredUsers);
          console.log("users", filteredUsers);
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

  const fetchProjects = async () => {
      try {
        const response = await fetch('https://api-crm-tegd.onrender.com/api/Project');
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Projects fetch error:', error);
      }
    };

  const fetchResources = useCallback(async (clientId: number) => {
      if (!clientId) return;
      
      setIsLoading(prev => ({ ...prev, resources: true }));
      try {
        const response = await fetch(`${baseUrl}/api/clients/${clientId}/resources`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch resources');
        }
        
        const data: Resource[] = await response.json();
        setResources(data);
      } catch (error) {
        console.error('Error fetching resources:', error);
        toast.error('Failed to load resources');
      } finally {
        setIsLoading(prev => ({ ...prev, resources: false }));
      }
    }, [selectedClient?.id, baseUrl]);

    useEffect(() => {
      if (selectedClient?.id) {
        fetchResources(selectedClient.id || 0);
      }
  }, [selectedClient?.id]);

  const handleUpdateResourceDetails = (id: string, field: 'title' | 'description', value: string) => {
    setPendingResources(prev => 
      prev.map(r => r.id === id ? { ...r, [field]: value } : r)
    );
  };
  
  const handleRemovePendingResource = (id: string) => {
    setPendingResources(prev => prev.filter(r => r.id !== id));
    toast.info('Resource removed');
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
    fetchUsers();
  }, []);

  useEffect(() => {
    if (clients.length > 0) {
      fetchClientUsers(clients);
    }
  }, [clients]);

  useEffect(() => {
    if (!clients) return;
   
    let filtered = clients;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = clients.filter(client =>
        (client.country?.toLowerCase() || '').includes(term) ||
        (client.phone?.toLowerCase() || '').includes(term) ||
        (client.email?.toLowerCase() || '').includes(term) ||
        (client.last_name?.toLowerCase() || '').includes(term) ||
        (client.first_name?.toLowerCase() || '').includes(term) ||
        (client.details?.toLowerCase() || '').includes(term)
      );
    }
   
    filtered = filterByRole(filtered);
   
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      if (dateB.getTime() !== dateA.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }
      const modifiedByA = String(a.modifiedBy || '');
      const modifiedByB = String(b.modifiedBy || '');
      return modifiedByA.localeCompare(modifiedByB);
    });
   
    setFilteredClients(filtered);
  }, [clients, searchTerm, currentUser, isAdmin]);

  const uploadResourcesForClient = async (
    clientId: number, 
    resources: Array<{
      title: string;
      description: string;
      file?: File;
      audioFile?: Blob;
    }>
  ) => {
    const uploadPromises = resources.map(async (resource) => {
      const formData = new FormData();
      formData.append('Title', resource.title);
      formData.append('Description', resource.description);
      formData.append('CreatedBy', currentUser?.userId?.toString() || '');
      
      if (resource.file) {
        formData.append('file', resource.file);
      } else if (resource.audioFile) {
        const audioFile = new File([resource.audioFile], `recording_${Date.now()}.webm`, {
          type: 'audio/webm'
        });
        formData.append('audioFile', audioFile);
      }
      
      const response = await fetch(`${baseUrl}/api/clients/${clientId}/resources`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload resource: ' + resource.title);
      }
      
      return response.json();
    });
    
    try {
      await Promise.all(uploadPromises);
      toast.success(`${resources.length} resource(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading resources:', error);
      toast.error('Some resources failed to upload');
      throw error;
    }
  };

  const handleSearch = (query: string) => {
    setSearchTerm(query);
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
 
      const response = await fetch(`${baseUrl}/api/Clients`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        
        const clientId = result.id || result.clientId || result.Id || result.ClientId || result.client_id;
        
        if (!clientId) {
          toast.error('Client created but ID not found');
          return { success: false, message: 'Client ID not returned from server' };
        }
      
        if (pendingResources.length > 0) {
          toast.info(`Uploading ${pendingResources.length} resource(s)...`);
          await uploadResourcesForClient(clientId, pendingResources);
        }
      
        await fetchClients();
        setPendingResources([]);
        toast.success('Client and resources created successfully');
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.message || 'Server error occurred' };
      }
    } catch (err) {
      console.error('Network error:', err);
      return { success: false, message: 'Kullanıcı oluşturulurken hata oluştu - Network error' };
    }
  };

  const updateClient = async (clientId: number, userData: Client) => {
    try {
      const formData = new FormData();
      
      formData.append('First_name', userData.first_name);
      formData.append('Last_name', userData.last_name);
      formData.append('Phone', userData.phone || '');
      formData.append('Email', userData.email);
      formData.append('Details', userData.details || '');
      formData.append('Country', userData.country || '');
      formData.append('City', userData.city || '');
      formData.append('Address', userData.address || '');
      formData.append('ZipCode', userData.zipCode || '');
      formData.append('VATNumber', userData.VATNumber || '');
      formData.append('ModifiedBy', userData.modifiedBy?.toString() || '1');
      
      if (userData.file) {
        formData.append('file', userData.file);
      }
      
      const response = await fetch(`${baseUrl}/api/Clients/${clientId}`, {
        method: 'PUT',
        body: formData,
      });
      
      if (response.ok) {
        if (pendingResources.length > 0) {
          toast.info(`Uploading ${pendingResources.length} new resource(s)...`);
          await uploadResourcesForClient(clientId, pendingResources);
        }
        
        await fetchClients();
        setPendingResources([]);
        toast.success('Client and resources updated successfully');
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
      VATNumber: '',
      fileUrl: ''
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
      city: clientData.city,
      fileUrl: clientData.fileUrl
    });
    setShowModal(true);
  };

  const openEditModalHandler = (client: Client) => openEditModal(client);

  const openAddModal = () => {
    resetForm();
    setModalMode('add');
    setShowModal(true);
  };

  const handleClientDiscussionClick = (clientId: number) => {
    setPendingClientId(clientId);
    setShowUserSelector(true);
  };
  
  const handleUserSelect = (user: User) => {
    setSelectedUserForDiscussion(user);
  };
  
  const handleConfirmUserSelection = () => {
    if (pendingClientId && selectedUserForDiscussion) {
      createDiscussion(pendingClientId, selectedUserForDiscussion);
    }
  };

  const createDiscussion = async (directClientId?: number, selectedUserForClient?: User) => {
    const isDirectCreate = directClientId !== undefined;
    
    if (!isDirectCreate && (!selectedUserForDiscussion || isCreatingDiscussion)) return;
    setIsCreatingDiscussion(true);
    
    let clientId: number;
    let selectedClient: Client | undefined;
    
    if (isDirectCreate) {
      clientId = directClientId;
      selectedClient = clients.find(c => c.id === directClientId);
      
      if (!selectedUserForClient) {
        setIsCreatingDiscussion(false);
        alert('Please select a user to discuss with.');
        return;
      }
    } else {
      clientId = (selectedClient?.id) ?? (pendingClientId || 0);
      selectedClient = selectedClient ?? (clientId ? clients.find(c => c.id === clientId) : undefined);
    }
    
    const computedTitle = isDirectCreate
      ? (selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : '')
      : (newDiscussionTitle.trim() || (selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : ''));
      
    if (!computedTitle) {
      setIsCreatingDiscussion(false);
      alert('Please enter a title or select a client to auto-fill the title.');
      return;
    }
    
    const receiverUserId = isDirectCreate
      ? selectedUserForClient?.userId || 0
      : selectedUserForDiscussion?.userId || 0;
    
    const participantIds = isDirectCreate
      ? [currentUser?.userId || 0, selectedUserForClient?.userId || 0]
      : [currentUser?.userId || 0, selectedUserForDiscussion?.userId || 0];
    
    const request: CreateDiscussionRequest = {
      title: computedTitle,
      description: isDirectCreate ? '' : newDiscussionDescription,
      createdByUserId: currentUser?.userId || 0,
      participantUserIds: participantIds,
      senderId: currentUser?.userId || 0,
      receiverId: receiverUserId,
      ...(clientId > 0 && { clientId: clientId }),
      clientIds: isDirectCreate ? [clientId] : [],
      status: isDirectCreate ? DiscussionStatus.NotStarted : DiscussionStatus.InProgress
    };
    
    try {
      const response = await fetch(`${baseUrl}/api/Chat/discussions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
    
      if (response.ok) {
        const newDiscussion = await response.json();
        
        if (currentUser && newDiscussion?.receiverId && Number(newDiscussion.receiverId) === Number(currentUser.userId)) {
          const senderLabel = users.find(u => u.userId === newDiscussion.senderId)?.fullName || currentUser.fullName;
          showToastForMessage({
            ...newDiscussion,
            messageType: 5,
            content: newDiscussion.title,
            senderName: senderLabel,
            createdAt: new Date()
          }, senderLabel);
        }
        
        setDiscussions(prev => [newDiscussion, ...prev]);
        
        if (!isDirectCreate) {
          setNewDiscussionTitle('');
          setNewDiscussionDescription('');
          setShowCreateDiscussion(false);
          setSelectedDiscussion(null);
        } else {
          setShowUserSelector(false);
          setPendingClientId(null);
          setSelectedUserForDiscussion(null);
        }
        
        setSelectedDiscussion(newDiscussion);
        
        if (isDirectCreate) {
          navigate(`/chats/${newDiscussion.id}`);
        }
      } else {
        throw new Error('Failed to create discussion');
      }
    } catch (error) {
      console.error('Error creating discussion:', error);
    } finally {
      setIsCreatingDiscussion(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Generate unique temp ID
      const tempId = `temp-${Date.now()}-${resourceIdCounter.current++}`;
      
      // Auto-add to pending resources with default title
      setPendingResources(prev => [...prev, {
        id: tempId,
        title: resourceTitle.trim() || file.name,
        description: resourceDescription.trim(),
        file: file,
      }]);
      
      setResourceTitle('');
      setResourceDescription('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success(`File "${file.name}" added`);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="bg-white shadow-sm">
        <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Clients</h1>
              <p className="mt-1 text-sm text-gray-500">Manage your clients and their information</p>
            </div>
            <button
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Yeni Kullanıcı</span>
            </button>
          </div>
        </div>
      </div>
   
      <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6">
          <div className="relative w-full">
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
      <div className="w-full">
      <div className="space-y-4">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-300">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {client.imageUrl ? (
                    <img 
                      src={client.imageUrl} 
                      alt={`${client.first_name} ${client.last_name}`} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <UserIcon className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                    {client.first_name} {client.last_name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">ID: #{client.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate(`/clients/${client.id}`)}
                  className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View Details"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>

                <button
                  onClick={() => openEditModalHandler(client)}
                  className="p-1.5 sm:p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Edit Client"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                
                {currentUser?.role === 'Yonetici' && (
                  <button
                    onClick={() => deleteClient(client.id)}
                    className="p-1.5 sm:p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Client"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}

                <button 
                  onClick={() => handleClientDiscussionClick(client.id)}
                  className="p-1.5 sm:p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Discussion"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-3 mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-gray-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">Email</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{client.email}</p>
                </div>
              </div>
              
              {client.phone && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{client.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {(client.city || client.country || client.address || client.zipCode) && (
              <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-3 mb-4">
                {(client.city || client.country) && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 mb-0.5">Location</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {[client.city, client.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
                
                {client.address && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Home className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 mb-0.5">Address</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {client.address} {client.zipCode && `(${client.zipCode})`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {client.details && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 mb-1">Details</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{client.details}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-gray-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-600">
                  {client.VATNumber && (
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">VAT: {client.VATNumber}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">
                      {new Date(client.createdAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Created by:</span>
                  <span className="font-medium text-gray-900">
                    {usersById[client.createdBy]?.fullName ?? "Unknown User"}
                  </span>
                </div>
                
                {client.modifiedBy && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Modified by:</span>
                    <span className="font-medium text-gray-900">
                      {usersById[client.modifiedBy]?.fullName ?? "Unknown User"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
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
        <div className="flex items-center justify-between p-4 border-b text-black">
          <h2 className="text-lg font-semibold">
            {modalMode === 'add' ? 'Yeni Kullanıcı Ekle' : 'Kullanıcı Düzenle'}
          </h2>
          <button
            onClick={() => setShowModal(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5 text-black" />
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
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
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
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
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
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
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
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
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
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
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
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
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
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
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
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
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
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
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
                  e.stopPropagation();
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({...formData, file, imageUrl: URL.createObjectURL(file)});
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-shadow duration-200 hover:shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Resources (Optional)
          </label>
          
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <input
                type="text"
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
                placeholder="Resource Title (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <textarea
                value={resourceDescription}
                onChange={(e) => setResourceDescription(e.target.value)}
                placeholder="Resource Description (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                fileInputRef.current?.click();
              }}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="flex flex-col items-center space-y-2">
                <UploadIcon className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Click to select a file
                </span>
                <span className="text-xs text-gray-500">
                  File will be added automatically when selected
                </span>
              </div>
            </button>
            </div>
          
          {pendingResources.length > 0 && (
            <div className="space-y-3">
            <div className="flex items-center justify-between w-full">
              <label className="block text-sm font-medium text-gray-700">
                Resources to Upload ({pendingResources.length})
              </label>
              <span className="text-xs text-gray-500">
                Will be uploaded when you create/update client
              </span>
            </div>

            {pendingResources.map((resource) => (
              <div
                key={resource.id}
                className="p-3 bg-white rounded-lg border border-gray-200 space-y-2 w-full"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-start space-x-2 flex-1 min-w-0">
                    {resource.file ? (
                      <FileIcon className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={resource.title}
                        onChange={(e) => handleUpdateResourceDetails(resource.id, 'title', e.target.value)}
                        placeholder="Resource title"
                        className="w-full text-sm font-medium text-gray-700 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 -mx-1"
                      />
                      <input
                        type="text"
                        value={resource.description}
                        onChange={(e) => handleUpdateResourceDetails(resource.id, 'description', e.target.value)}
                        placeholder="Add description..."
                        className="w-full text-xs text-gray-500 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 -mx-1 mt-1"
                      />
                      <p
                        className="text-xs text-gray-400 mt-1 truncate"
                        title={resource.file?.name || 'Audio Recording'} // Tooltip for full file name
                      >
                        {resource.file?.name || 'Audio Recording'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePendingResource(resource.id)}
                    className="text-red-600 hover:text-red-800 ml-2 flex-shrink-0"
                    title="Remove resource"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
          
          {resources.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Existing Resources
              </label>
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-2">
                    <FileIcon className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-700">{resource.title}</span>
                  </div>    
                  <a 
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Details
            </label>
            <textarea
              rows={4}
              value={formData.details}
              onChange={(e) => setFormData({...formData, details: e.target.value})}
              className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
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

    {showUserSelector && (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={() => {
          setShowUserSelector(false);
          setPendingClientId(null);
          setSelectedUserForDiscussion(null);
        }}
      />
      
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Select User</h3>
            <button
              onClick={() => {
                setShowUserSelector(false);
                setPendingClientId(null);
                setSelectedUserForDiscussion(null);
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {users
                .filter(user => user.userId !== currentUser?.userId)
                .map(user => (
                  <div
                    key={user.userId}
                    onClick={() => handleUserSelect(user)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedUserForDiscussion?.userId === user.userId
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                        selectedUserForDiscussion?.userId === user.userId
                          ? 'bg-blue-500'
                          : 'bg-gray-400'
                      }`}>
                        {user.fullName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {user.fullName}
                        </div>
                        {user.email && (
                          <div className="text-sm text-gray-500 truncate">
                            {user.email}
                          </div>
                        )}
                      </div>
                      
                      {selectedUserForDiscussion?.userId === user.userId && (
                        <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="p-4 border-t bg-gray-50">
            <button
              onClick={handleConfirmUserSelection}
              disabled={!selectedUserForDiscussion}
              className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="h-5 w-5" />
              Create Discussion
            </button>
          </div>
        </div>
      </>
    )}
    </div>
  );
}