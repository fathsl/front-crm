import { useAtomValue } from "jotai";
import {
  ArrowUpRight,
  Calendar,
  Mail,
  MessageSquare,
  UsersIcon,
} from "lucide-react";
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
  const [userUnreadCounts, setUserUnreadCounts] = useState<{
    [userId: number]: number;
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
        throw new Error("Failed to fetch users");
      }
    } catch (err) {
      setError("Kullanıcılar yüklenirken hata oluştu");
      console.error("Error fetching users:", err);
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
        throw new Error("Failed to fetch clients");
      }
    } catch (err) {
      setError("Kullanıcılar yüklenirken hata oluştu");
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDiscussions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${baseUrl}/api/Chat/discussions/${currentUser?.userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setAllDiscussions(data);
      } else {
        throw new Error("Failed to fetch discussions");
      }
    } catch (err) {
      setError("Tartışmalar yüklenirken hata oluştu");
      console.error("Error fetching discussions:", err);
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
        throw new Error("Failed to fetch clients");
      }
    } catch (err) {
      setError("Kullanıcılar yüklenirken hata oluştu");
      console.error("Error fetching clients:", err);
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
      console.error("Error fetching unread counts:", error);
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
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getClientsCreatedToday = (userId: number) => {
    return clients.filter(
      (client) => client.createdBy === userId && isToday(client.createdAt)
    ).length;
  };

  const getDiscussionsCreatedTodayByUser = (userId: number) => {
    return allDiscussions.filter(
      (discussion) =>
        discussion.createdByUserId === userId && isToday(discussion.createdAt)
    ).length;
  };

  const getMeetingsCreatedTodayByUser = (userId: number) => {
    return meetings.filter(
      (meeting) => meeting.createdBy === userId && isToday(meeting.createdAt)
    ).length;
  };

  const getUnreadMessageCount = (userId: number) => {
    return userUnreadCounts[userId] || 0;
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value: number;
  }) => (
    <div className="flex items-center justify-between py-3 px-4 border-b border-gray-200 last:border-b-0">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <span className="text-lg font-semibold text-black">{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-black mb-2">
                Progress Dashboard
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Track team activities and daily performance metrics
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {users.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-2 gap-4 sm:gap-6">
            {users.map((user) => {
              const todayClientsCount = getClientsCreatedToday(user.userId);
              const discussionCount = getDiscussionsCreatedTodayByUser(
                user.userId
              );
              const meetingCount = getMeetingsCreatedTodayByUser(user.userId);
              const unreadMessageCount = getUnreadMessageCount(user.userId);

              return (
                <div
                  key={user.userId}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden"
                >
                  <div className="p-3 sm:p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {user.kullaniciAdi.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {user.kullaniciAdi}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4">
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                      <div className="flex items-center gap-2 p-2.5 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="w-8 h-8 rounded-md bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                          <UsersIcon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 font-medium">
                            Clients
                          </p>
                          <p className="text-base sm:text-lg font-bold text-gray-900">
                            {todayClientsCount}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2.5 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="w-8 h-8 rounded-md bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 font-medium">
                            Discussions
                          </p>
                          <p className="text-base sm:text-lg font-bold text-gray-900">
                            {discussionCount}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2.5 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="w-8 h-8 rounded-md bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 font-medium">
                            Meetings
                          </p>
                          <p className="text-base sm:text-lg font-bold text-gray-900">
                            {meetingCount}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2.5 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors relative">
                        <div className="w-8 h-8 rounded-md bg-white shadow-sm flex items-center justify-center flex-shrink-0 relative">
                          <Mail className="w-4 h-4 text-gray-600" />
                          {unreadMessageCount > 0 && (
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 font-medium">
                            Unread
                          </p>
                          <p className="text-base sm:text-lg font-bold text-gray-900">
                            {unreadMessageCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-3 sm:px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
                    <p className="text-gray-500">Updated today</p>
                    <button
                      onClick={() => navigate(`/progress/${user.userId}`)}
                      className="p-1.5 rounded bg-gray-700 hover:bg-gray-900 text-white transition-all duration-200 active:scale-95"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              <UsersIcon className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-black mb-2">
              No users found
            </h3>
            <p className="text-gray-600 text-center">
              Users will appear here when loaded
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
