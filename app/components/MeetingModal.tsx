import { Calendar, Clock, FileText, MapPin, Save, UsersIcon, X } from "lucide-react";
import { useState } from "react";
import type { Client, User } from "~/help";

type FormErrors = Record<string, string>;

const MeetingModal = ({ isOpen, onClose, onSuccess, baseUrl, currentUser, users, clients }: { isOpen: boolean, onClose: () => void, onSuccess?: (data: any) => void, baseUrl: string, currentUser: User, users: User[], clients: Client[] }) => {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    meetingDate: string;
    durationMinutes: number;
    location: string;
    meetingType: string;
    status: string;
    clientId: number;
    participantIds: number[];
    participantRoles: Record<number, string>;
    createdBy: string | number;
  }>({
    title: '',
    description: '',
    meetingDate: '',
    durationMinutes: 0,
    location: '',
    meetingType: '',
    status: '',
    clientId: 0,
    participantIds: [],
    participantRoles: {},
    createdBy: ''
  });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const handleClientSelect = (client : Client) => {
      setFormData(prev => ({
        ...prev,
        clientId: client.id
      }));
      setIsClientDropdownOpen(false);
      setClientSearchTerm('');
    };
  
    const handleClientClear = () => {
      setFormData(prev => ({
        ...prev,
        id: null
      }));
    };

    const selectedClient = clients.find(c => c.id === formData.clientId);

    const filteredClients = clients.filter(client => {
      const searchLower = clientSearchTerm.toLowerCase();
      const firstName = (client.first_name || '').toLowerCase();
      const lastName = (client.last_name || '').toLowerCase();
      const email = (client.email || '').toLowerCase();
      const clientName = (client.first_name || client.email || '').toLowerCase();
      
      return firstName.includes(searchLower) || 
             lastName.includes(searchLower) || 
             email.includes(searchLower) ||
             clientName.includes(searchLower);
    });

    const handleInputChange = (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value } = e.target;
    
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    };

    const handleParticipantToggle = (userId : number) => {
      setFormData(prev => ({
        ...prev,
        participantIds: prev.participantIds.includes(userId)
          ? prev.participantIds.filter(id => id !== userId)
          : [...prev.participantIds, userId]
      }));
    };

    const validateForm = () => {
      const newErrors: FormErrors = {};
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (!formData.meetingDate) newErrors.meetingDate = 'Meeting date is required';
      if (formData.durationMinutes <= 0) newErrors.durationMinutes = 'Please enter a valid duration';
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
  
    const handleSubmit = async () => {
      if (!validateForm()) return;
  
      setLoading(true);
      try {
        const response = await fetch(`${baseUrl}/api/Meetings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            clientId: formData.clientId || null,
            participantIds: formData.participantIds.length > 0 ? formData.participantIds : null
          }),
        });
  
        if (response.ok) {
          const data = await response.json();
          onSuccess?.(data);
          handleClose();
        } else {
          const error = await response.json();
          alert('Error creating meeting: ' + (error.message || 'Unknown error'));
        }
      } catch (err) {
        console.error('Error creating meeting:', err);
        alert('An error occurred while creating the meeting');
      } finally {
        setLoading(false);
      }
    };
  
    const handleClose = () => {
      setFormData({
        title: '',
        description: '',
        meetingDate: '',
        durationMinutes: 60,
        location: '',
        meetingType: 'in-person',
        status: 'scheduled',
        createdBy: currentUser?.userId || '',
        clientId: 0,
        participantIds: [],
        participantRoles: {}
      });
      setErrors({});
      onClose();
    };
  
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
      <div className="bg-white rounded-l-2xl w-full max-w-2xl h-full overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">Add New Meeting</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="inline h-4 w-4 mr-1" />
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Meeting title"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Meeting details"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Meeting Date *
                </label>
                <input
                  type="datetime-local"
                  name="meetingDate"
                  value={formData.meetingDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.meetingDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.meetingDate && <p className="text-red-500 text-sm mt-1">{errors.meetingDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  name="durationMinutes"
                  value={formData.durationMinutes}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="inline h-4 w-4 mr-1" />
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Meeting location"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Type</label>
                <select
                  name="meetingType"
                  value={formData.meetingType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="in-person">In Person</option>
                  <option value="online">Online</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <div className="relative">
                <div
                  onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                  className="min-h-[42px] w-full border border-gray-300 rounded-lg px-3 py-2 bg-white cursor-pointer hover:border-gray-400 focus:border-blue-500 transition-all duration-200 flex items-center justify-between"
                >
                  <div className="flex-1 flex items-center gap-2">
                    {!selectedClient ? (
                      <span className="text-gray-500 text-sm">Select Client (Optional)</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {((selectedClient.first_name || selectedClient.email|| 'C').charAt(0) + 
                            (selectedClient.last_name || selectedClient.email || 'L').charAt(0)).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-900">
                          {selectedClient.first_name && selectedClient.last_name 
                            ? `${selectedClient.first_name} ${selectedClient.last_name}`
                            : selectedClient.email}
                        </span>
                        {selectedClient && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClientClear();
                            }}
                            className="ml-1 hover:bg-gray-200 rounded-full p-1 transition-colors"
                          >
                            <X className="w-3 h-3 text-gray-600" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                      isClientDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {isClientDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
                    <div className="p-3">
                      <div className="relative mb-3">
                        <input
                          type="text"
                          placeholder="Search clients..."
                          value={clientSearchTerm}
                          onChange={(e) => setClientSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                          autoFocus
                        />
                        <svg
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {clientSearchTerm && (
                          <button
                            onClick={() => setClientSearchTerm('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {selectedClient && (
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                          <span className="text-sm font-medium text-gray-700">Selected Client</span>
                          <button
                            onClick={() => {
                              handleClientClear();
                              setIsClientDropdownOpen(false);
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="max-h-40 overflow-y-auto px-3 pb-3">
                      {filteredClients.map(client => {
                        const isSelected = formData.clientId === client.id;
                        const displayName = client.first_name && client.last_name 
                          ? `${client.first_name} ${client.last_name}`
                          : client.first_name || client.email;
                        const initials = ((client.first_name || client.email || 'C').charAt(0) + 
                                         (client.last_name || client.email || 'L').charAt(0)).toUpperCase();
                        
                        return (
                          <div
                            key={client.id}
                            onClick={() => handleClientSelect(client)}
                            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-50 text-blue-900'
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{displayName}</div>
                                {client.email && (
                                  <div className="text-xs text-gray-500 truncate">{client.email}</div>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        );
                      })}

                      {filteredClients.length === 0 && clientSearchTerm && (
                        <div className="text-center text-gray-500 text-sm py-4">
                          <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          No clients found for "{clientSearchTerm}"
                        </div>
                      )}
                      
                      {clients.length === 0 && (
                        <div className="text-center text-gray-500 text-sm py-4">
                          <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          No clients available
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UsersIcon className="inline h-4 w-4 mr-1" />
                Participants ({formData.participantIds.length} selected)
              </label>
              <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                {users.map(user => (
                  <label
                    key={user.userId}
                    className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={formData.participantIds.includes(user.userId)}
                      onChange={() => handleParticipantToggle(user.userId)}
                      className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{user.kullaniciAdi}</span>
                  </label>
                ))}
                {users.length === 0 && (
                  <p className="text-sm text-gray-500 p-3 text-center">No users found</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
      )
  };
  
  export default MeetingModal;