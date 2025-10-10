import { ArrowLeft, Calendar, MessageSquare, TrendingUp, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { Client, Discussion, Meeting, User } from "~/help";

interface MonthlyStats {
    month: string;
    clients: number;
    discussions: number;
    meetings: number;
}

export default function UserProgressDashboard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const baseUrl = "https://api-crm-tegd.onrender.com";

    const [user, setUser] = useState<User | null>(null);
    const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
    const [stats, setStats] = useState({
      clients: 0,
      discussions: 0,
      meetings: 0,
      unreadMessages: 0
    });

    const getMonthYear = (dateString: Date) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth();
        return { year, month, key: `${year}-${String(month + 1).padStart(2, '0')}` };
    };
    
    const formatMonthYear = (key: string) => {
        const [year, month] = key.split('-');
        const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

    useEffect(() => {
      if (id) {
        fetchUserData();
      }
    }, [id]);

    const fetchUserData = async () => {
        try {
          setLoading(true);
          setError('');
    
          const userResponse = await fetch(`${baseUrl}/api/User/${id}`);
          if (!userResponse.ok) throw new Error('Failed to fetch user');
          const userData = await userResponse.json();
          setUser(userData);
    
          const clientsResponse = await fetch(`${baseUrl}/api/Clients`);
          let userClients: Client[] = [];
          if (clientsResponse.ok) {
            const clientsData = await clientsResponse.json();
            userClients = clientsData.filter((c: Client) => c.id === parseInt(id || '0'));
            setStats(prev => ({ ...prev, clients: userClients.length }));
          }
    
          const discussionsResponse = await fetch(`${baseUrl}/api/Chat/discussions/${id}`);
          let userDiscussions: Discussion[] = [];
          if (discussionsResponse.ok) {
            userDiscussions = await discussionsResponse.json();
            setStats(prev => ({ ...prev, discussions: userDiscussions.length }));
          }
    
          const meetingsResponse = await fetch(`${baseUrl}/api/Meeting`);
          let userMeetings: Meeting[] = [];
          if (meetingsResponse.ok) {
            const meetingsData = await meetingsResponse.json();
            userMeetings = meetingsData.filter((m: Meeting) => m.clientId === parseInt(id || '0'));
            setStats(prev => ({ ...prev, meetings: userMeetings.length }));
          }
    
          const unreadResponse = await fetch(`${baseUrl}/api/Chat/users/unreadcounts`);
          if (unreadResponse.ok) {
            const unreadData = await unreadResponse.json();
            setStats(prev => ({ ...prev, unreadMessages: unreadData[id || '0'] || 0 }));
          }
    
          const monthlyData: { [key: string]: MonthlyStats } = {};
    
          userClients.forEach((client: Client) => {
            const dateField = client.createdAt;
            if (dateField) {
              const { key } = getMonthYear(dateField);
              if (!monthlyData[key]) {
                monthlyData[key] = { month: key, clients: 0, discussions: 0, meetings: 0 };
              }
              monthlyData[key].clients++;
            }
          });
    
          userDiscussions.forEach((discussion: Discussion) => {
            const dateField = discussion.createdAt;
            if (dateField) {
              const { key } = getMonthYear(dateField);
              if (!monthlyData[key]) {
                monthlyData[key] = { month: key, clients: 0, discussions: 0, meetings: 0 };
              }
              monthlyData[key].discussions++;
            }
          });
    
          userMeetings.forEach((meeting: Meeting) => {
            const dateField = meeting.meetingDate;
            if (dateField) {
              const { key } = getMonthYear(dateField);
              if (!monthlyData[key]) {
                monthlyData[key] = { month: key, clients: 0, discussions: 0, meetings: 0 };
              }
              monthlyData[key].meetings++;
            }
          });
    
          const sortedMonthlyStats = Object.values(monthlyData).sort((a, b) => 
            b.month.localeCompare(a.month)
          );
    
          setMonthlyStats(sortedMonthlyStats);
    
        } catch (err) {
          setError('Error fetching user data');
          console.error('Error fetching user data:', err);
        } finally {
          setLoading(false);
        }
      };
  
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <div className="text-red-600 text-center">
              <p className="text-lg font-semibold">{error}</p>
              <button
                onClick={() => navigate(-1)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      );
    }
  
    if (!user) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">User not found</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back
            </button>
          </div>
        </div>
      );
    }
  
    const statCards = [
      {
        title: 'Clients',
        value: stats.clients,
        icon: UsersIcon,
        color: 'blue',
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600'
      },
      {
        title: 'Discussions',
        value: stats.discussions,
        icon: MessageSquare,
        color: 'green',
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600'
      },
      {
        title: 'Meetings',
        value: stats.meetings,
        icon: Calendar,
        color: 'purple',
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600'
      },
      {
        title: 'Unread Messages',
        value: stats.unreadMessages,
        icon: TrendingUp,
        color: 'orange',
        bgColor: 'bg-orange-50',
        iconColor: 'text-orange-600'
      }
    ];
  
    return (
        <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Geri Dön
            </button>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{user.fullName}</h1>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <span className="font-medium mr-1">Username:</span>
                      {user.kullaniciAdi}
                    </span>
                    <span className="flex items-center">
                      <span className="font-medium mr-1">Email:</span>
                      {user.email}
                    </span>
                    <span className="flex items-center">
                      <span className="font-medium mr-1">Telefon:</span>
                      {user.telefon}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.durum === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.durum}
                  </span>
                </div>
              </div>
            </div>
          </div>
  
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Clients</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.clients}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
  
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Discussions</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.discussions}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </div>
  
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Meetings</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.meetings}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Unread Messages</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.unreadMessages}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
  
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Statistics</h2>
            {monthlyStats.length === 0 ? (
              <p className="text-gray-500 text-center py-8">There is no monthly data yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clients
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Discussions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Meetings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {monthlyStats.map((stat) => (
                      <tr key={stat.month} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatMonthYear(stat.month)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {stat.clients}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {stat.discussions}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {stat.meetings}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {stat.clients + stat.discussions + stat.meetings}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-sm text-gray-600">Total Activity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.clients + stats.discussions + stats.meetings}
                </p>
              </div>
              <div className="border-l-4 border-green-600 pl-4">
                <p className="text-sm text-gray-600">Pending Operations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unreadMessages}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }