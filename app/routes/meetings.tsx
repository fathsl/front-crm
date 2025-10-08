import { useAtomValue } from "jotai";
import { Building2, Calendar, ClockIcon, Mail, MapPin, PlusIcon, SearchIcon, UserIcon, UsersIcon, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import MeetingModal from "~/components/MeetingModal";
import type { Client, Meeting, User } from "~/help";
import { userAtom } from "~/utils/userAtom";

const MeetingsPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
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

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setFilteredMeetings(meetings);
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
    setFilteredMeetings(filtered);
  };

  useEffect(() => {
    fetchUsers();
    fetchClients();
    fetchMeetings();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'Planned': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'In Progress': 'bg-yellow-100 text-yellow-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
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
              onClick={() => setShowModal(true)}
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
        ) : filteredMeetings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Toplantı bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Arama kriterlerinize uygun toplantı bulunamadı' : 'Henüz toplantı eklenmemiş'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {filteredMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 break-words">
                          {meeting.title}
                        </h3>
                      </div>
                      {meeting.description && (
                        <p className="text-sm text-gray-600 mb-3 break-words">
                          {meeting.description}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusBadge(meeting.status)}`}>
                      {meeting.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="break-words">{formatDate(meeting.meetingDate)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>{meeting.durationMinutes} dakika</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {getMeetingTypeIcon(meeting.meetingType)}
                      <span>{meeting.meetingType}</span>
                    </div>

                    {meeting.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="break-words">{meeting.location}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <UsersIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>{meeting.participantCount} katılımcı</span>
                    </div>
                  </div>

                  {(meeting.clientName || meeting.clientCompanyName) && (
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                        Müşteri Bilgileri
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {meeting.clientName && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <UserIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="break-words">{meeting.clientName}</span>
                          </div>
                        )}
                        {meeting.clientCompanyName && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="break-words">{meeting.clientCompanyName}</span>
                          </div>
                        )}
                        {meeting.clientEmail && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2">
                            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="break-words">{meeting.clientEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {meeting.organizerName && (
                    <div className="border-t border-gray-100 pt-3 mt-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <UserIcon className="h-3 w-3 flex-shrink-0" />
                        <span>Organizatör: <span className="font-medium">{meeting.organizerName}</span></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <MeetingModal users={users} clients={clients} isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={() => setShowModal(false)} currentUser={currentUser} baseUrl={baseUrl} />}
    </div>
  );
  };
  
  export default MeetingsPage;