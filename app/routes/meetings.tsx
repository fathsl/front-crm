import { useAtomValue } from "jotai";
import { AlertCircle, Building2, Calendar, CheckCircle, ChevronDown, ChevronUp, Clock, EditIcon, Mail, MapPin, PlusIcon, SearchIcon, Trash, UserIcon, Users, Video, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import MeetingModal from "~/components/MeetingModal";
import type { Client, Meeting, Participant, User } from "~/help";
import { userAtom } from "~/utils/userAtom";

const MeetingsPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [participantsByMeeting, setParticipantsByMeeting] = useState<Record<number, Participant[]>>({});
  const [expandedMeetings, setExpandedMeetings] = useState<Record<number, boolean>>({});
  const [error, setError] = useState('');
  const currentUser = useAtomValue(userAtom) as unknown as User;
  const baseUrl = "https://api-crm-tegd.onrender.com";

  const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${baseUrl}/api/User`);
        if (response.ok) {
          const data = await response.json();
          const filteredUsers = data.filter((user: User) => user.userId !== currentUser?.userId).sort((a: User, b: User) => a.kullaniciAdi.localeCompare(b.kullaniciAdi));
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

  const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${baseUrl}/api/Clients`);
        if (response.ok) {
          const data = await response.json();
          setClients(data);
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

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/Meeting`);
      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
        console.log("meetings", data);
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

  const fetchParticipants = async (meetingId : number) => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/Meeting/${meetingId}/participants`);
      if (response.ok) {
        const data = await response.json();
        setParticipantsByMeeting((prev) => ({
          ...prev,
          [meetingId]: data,
        }));
        console.log("data", data);
        
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

  useEffect(() => {
    if (meetings.length > 0) {
      meetings.forEach(meeting => {
        fetchParticipants(meeting.id);
      });
    }
  }, [meetings]);

  const toggleExpanded = (meetingId: number) => {
    setExpandedMeetings(prev => ({
      ...prev,
      [meetingId]: !prev[meetingId]
    }));
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setMeetings(meetings);
      return;
    }

    const searchLower = value.toLowerCase();
    const filtered = meetings.filter(meeting => 
      meeting.title?.toLowerCase().includes(searchLower) ||
      meeting.clientName?.toLowerCase().includes(searchLower) ||
      meeting.clientCompanyName?.toLowerCase().includes(searchLower) ||
      meeting.organizerName?.toLowerCase().includes(searchLower) ||
      meeting.location?.toLowerCase().includes(searchLower) ||
      meeting.status?.toLowerCase().includes(searchLower)
    );
    setMeetings(filtered);
  };

  useEffect(() => {
    fetchUsers();
    fetchClients();
    fetchMeetings();
  }, []);

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status : string) => {
    const iconClass = "h-3 w-3";
    switch(status) {
      case 'Completed': return <CheckCircle className={iconClass} />;
      case 'Cancelled': return <XCircle className={iconClass} />;
      case 'Pending': return <AlertCircle className={iconClass} />;
      default: return <Calendar className={iconClass} />;
    }
  };

  const formatTime = (dateString : Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      Scheduled: 'bg-blue-100 text-blue-700',
      Completed: 'bg-green-100 text-green-700',
      Cancelled: 'bg-red-100 text-red-700',
      Pending: 'bg-yellow-100 text-yellow-700'
    };
  
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'Online':
        return <Video className="h-4 w-4" />;
      case 'In-Person':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const deleteMeeting = async (meetingId: number) => {
    if (!confirm('Bu toplantıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/api/Meeting/${meetingId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchMeetings();
        alert('Toplantı başarıyla silindi');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Toplantı silinirken hata oluştu');
      }
    } catch (err) {
      alert('Kullanıcı silinirken hata oluştu');
    }
  };

  const updateMeeting = async (meetingId: number, meetingData: Meeting) => {
    try {
      const updateDto = {
        Title: meetingData.title,
        Description: meetingData.description || null,
        MeetingDate: meetingData.meetingDate,
        DurationMinutes: meetingData.durationMinutes,
        Location: meetingData.location || null,
        MeetingType: meetingData.meetingType,
        Status: meetingData.status,
        ClientId: meetingData.clientId || null,
        ModifiedBy: meetingData.modifiedBy || 1,
        ParticipantIds: meetingData.participantIds || []
      };
  
      const response = await fetch(`${baseUrl}/api/Meeting/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateDto),
      });
  
      if (response.ok) {
        await fetchMeetings();
        toast.success('Meeting updated successfully');
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.message };
      }
    } catch (err) {
      console.error('Error updating meeting:', err);
      return { success: false, message: 'Toplantı güncellenirken hata oluştu' };
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="bg-white shadow-sm">
        <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Toplantılar</h1>
              <p className="mt-1 text-sm text-gray-500">Toplantılarınızı yönetin ve detaylarını görüntüleyin</p>
            </div>
            <button
              onClick={() => {
                setEditingMeeting(null);
                setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Yeni Toplantı</span>
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
        ) : meetings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Toplantı bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Arama kriterlerinize uygun toplantı bulunamadı' : 'Henüz toplantı eklenmemiş'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {meetings.map((meeting) => {
              const participantsData = participantsByMeeting[meeting.id] || [];
              const participants = participantsData.map(p => {
                const user = users.find(u => u.userId === p.userId);
                return {
                  ...p,
                  name: user ? `${user.kullaniciAdi}` : (p.userName || 'Unknown User'),
                  email: user?.email || p.userEmail || ''
                };
              });
              const client = clients.find(c => c.id === meeting.clientId);
              const organizer = users.find(u => u.userId === meeting.createdBy);
              const isExpanded = expandedMeetings[meeting.id] || false;
              return (
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-start gap-3 mb-2">
                  <h3 className="text-base font-semibold text-gray-900 flex-1 line-clamp-2">
                    {meeting.title}
                  </h3>
                  <div className="flex flex-col justify-end gap-2">
                    <div className="flex flex-row justify-end gap-6">
                      <button onClick={() => {
                        setEditingMeeting(meeting);
                        setShowModal(true);
                        }}>
                        <EditIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteMeeting(meeting.id)}>
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${getStatusStyle(meeting.status)}`}>
                      {getStatusIcon(meeting.status)}
                      <span className="hidden sm:inline">{meeting.status}</span>
                  </span>
                  </div>
                </div>
                {meeting.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {meeting.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{formatDate(meeting.meetingDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span>{formatTime(meeting.meetingDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    {getMeetingTypeIcon(meeting.meetingType)}
                    <span className="truncate">{meeting.meetingType}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span>{participants.length} katılımcı</span>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 space-y-3 bg-gray-50">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <span>Süre: {meeting.durationMinutes} dakika</span>
                    </div>
                    {meeting.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <span className="truncate">{meeting.location}</span>
                      </div>
                    )}
                  </div>

                  {client && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        Müşteri
                      </h4>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900 font-medium truncate">
                            {client.first_name} {client.last_name}
                          </span>
                        </div>
                        {client.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-blue-600 text-xs truncate">{client.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {participants.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      Katılımcılar ({participants.length})
                    </h4>
                    <div className="space-y-2">
                      {participants.map(participant => (
                        <div key={participant.participant_id} className="flex items-center gap-2 text-sm">
                          <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="h-3.5 w-3.5 text-indigo-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-gray-900 font-medium text-xs truncate">{participant.name}</p>
                            <p className="text-gray-500 text-xs truncate">{participant.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                  {organizer && (
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                      <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="h-3.5 w-3.5 text-amber-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500">Organizatör</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{organizer.userId}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                  onClick={() => toggleExpanded(meeting.id)}
                  className="w-full py-2 px-4 flex items-center justify-center gap-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors border-t border-gray-100"
              >
                <span>{isExpanded ? 'Daha Az Göster' : 'Detayları Göster'}</span>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && 
        <MeetingModal 
          users={users} 
          clients={clients} 
          isOpen={showModal} 
          onClose={() => {
            setShowModal(false);
            setEditingMeeting(null);
          }}
          onSuccess={async () => {
            await fetchMeetings();
            setShowModal(false);
            setEditingMeeting(null);
          }}
          currentUser={currentUser} 
          baseUrl={baseUrl} 
          editingMeeting={editingMeeting} 
        />
      }
    </div>
  );
  };
  
  export default MeetingsPage;