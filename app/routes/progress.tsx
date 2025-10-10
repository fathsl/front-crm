import { useAtomValue } from "jotai";
import { Calendar, Mail, MessageSquare, SquareArrowOutUpRight, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import type { Client, Discussion, Meeting, User } from "~/help";
import { userAtom } from "~/utils/userAtom";

export default function ProgressPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [allDiscussions, setAllDiscussions] = useState<Discussion[]>([]);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [userUnreadCounts, setUserUnreadCounts] = useState<{ [userId: number]: number }>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const currentUser = useAtomValue(userAtom) as unknown as User;
    const baseUrl = "https://api-crm-tegd.onrender.com";

    const fetchUsers = async () => {
        try {
          setLoading(true);
          const response = await fetch(`${baseUrl}/api/User`);
          if (response.ok) {
            const data = await response.json();
            const sortedUsers = data.sort((a: User, b: User) => 
                a.kullaniciAdi.localeCompare(b.kullaniciAdi)
              );
            setUsers(sortedUsers);
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

    const fetchAllDiscussions = async () => {
        try {
          setLoading(true);
          const response = await fetch(`${baseUrl}/api/Chat/discussions/${currentUser?.userId}`);          
          if (response.ok) {
            const data = await response.json();
            setAllDiscussions(data);
          } else {
            throw new Error('Failed to fetch discussions');
          }
        } catch (err) {
          setError('Tartışmalar yüklenirken hata oluştu');
          console.error('Error fetching discussions:', err);
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

    const fetchAllUnreadCounts = async () => {
        try {
          const response = await fetch(`${baseUrl}/api/Chat/users/unreadcounts`);
          if (response.ok) {
            const counts = await response.json();
            setUserUnreadCounts(counts);
          }
        } catch (error) {
          console.error('Error fetching unread counts:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchClients();
        fetchAllDiscussions();
        fetchMeetings();
        fetchAllUnreadCounts();
    }, []);

    const isToday = (dateString: Date) => {
        const date = new Date(dateString);
        const today = new Date();
        return date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear();
    };

    const getClientsCreatedToday = (userId: number) => {
        return clients.filter((client) => 
          client.createdBy === userId && isToday(client.createdAt)
        ).length;
    };

    const getDiscussionsCreatedTodayByUser = (userId: number) => {
        return allDiscussions.filter((discussion) => 
          discussion.createdByUserId === userId && isToday(discussion.createdAt)
        ).length;
    };

    const getMeetingsCreatedTodayByUser = (userId: number) => {
        return meetings.filter((meeting) => 
          meeting.createdBy === userId && isToday(meeting.createdAt)
        ).length;
    };

    const getUnreadMessageCount = (userId: number) => {
        return userUnreadCounts[userId] || 0;
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-800 mb-2">
            Progress Dashboard
          </h1>
          <p className="text-slate-600">
            View user activities and daily statistics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {users.map((user) => {
            const todayClientsCount = getClientsCreatedToday(user.userId);
            const discussionCount = getDiscussionsCreatedTodayByUser(user.userId);
            const meetingCount = getMeetingsCreatedTodayByUser(user.userId);
            const unreadMessageCount = getUnreadMessageCount(user.userId);
            return (
              <div
                key={user.userId}
                className="bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-300"
              >
                <div className="p-2 border-b border-slate-100">
                  <div className="flex flex-row justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-200">
                        <span className="text-slate-700 font-semibold text-lg">
                            {user.kullaniciAdi.charAt(0)}
                        </span>
                        </div>
                        <div className="flex-1">
                        <h3 className="text-slate-900 font-semibold text-lg mb-1">
                            {user.kullaniciAdi}
                        </h3>
                        <p className="text-slate-500 text-sm">{user.email}</p>
                        </div>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                          <UsersIcon className="w-5 h-5 text-slate-600" />
                        </div>
                        <span className="text-slate-700 font-medium">Clients Today</span>
                      </div>
                      <span className="text-lg font-semibold text-slate-900 mr-2">
                        {todayClientsCount}
                        </span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-slate-600" />
                        </div>
                        <span className="text-slate-700 font-medium">Discussions</span>
                      </div>
                      <span className="text-lg font-semibold text-slate-900 mr-2">
                        {discussionCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-slate-600" />
                        </div>
                        <span className="text-slate-700 font-medium">Meetings</span>
                      </div>
                      <span className="text-lg font-semibold text-slate-900 mr-2">
                        {meetingCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-slate-600" />
                        </div>
                        <span className="text-slate-700 font-medium">Unread Messages</span>
                      </div>
                      <span className="text-lg font-semibold text-slate-900 mr-2">
                        {unreadMessageCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="py-1 px-2 bg-slate-50 border-t border-slate-100">
                  <div className="flex flex-row justify-between items-center">
                    <p className="text-slate-500 text-xs text-center">
                        Last updated: Today
                    </p>
                    <div className="m-2">
                        <button className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-1 px-2 rounded-lg" onClick={() => navigate(`/progress/${user.userId}`)}>
                            <SquareArrowOutUpRight className="w-5 h-5" />
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-slate-600 text-lg font-medium mb-2">
              No users found
            </h3>
            <p className="text-slate-400">
              Users will appear here when loaded
            </p>
          </div>
        )}
      </div>
      </div>
    );
  }