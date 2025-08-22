import { ChevronRight, Clock, MessageCircle,Search, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Chat, Message, User } from "~/help";
import { ChatService } from "~/services/chatService";

const ChatPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [chatRooms, setChatRooms] = useState<Chat[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState({ userId: 1, fullName: 'Current User' });
    const [activeTab, setActiveTab] = useState('rooms');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const baseUrl = "http://localhost:5178";
  
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${baseUrl}/api/User`);
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
          setFilteredUsers(data);
          console.log("users", data);
        } else {
          throw new Error('Failed to fetch users');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };
  
    const loadChatRooms = useCallback(() => {
        if (!currentUser?.userId) return;
    
        setRoomsLoading(true);
        const unsubscribe = ChatService.subscribeToUserChats(
          currentUser.userId.toString(),
          (chats) => {
            const enrichedChats = chats.map(chat => {
              const otherParticipant = chat.participants.find((p:number) => p !== currentUser.userId);
              const user = users.find(u => u.userId === otherParticipant);
              return {
                ...chat,
                user: user || { userId: otherParticipant, fullName: 'Unknown User', kullaniciAdi: 'unknown' },
                unreadCount: chat.unreadCount || 0
              };
            });
            setChatRooms(enrichedChats);
            setRoomsLoading(false);
          }
        );
    
        return unsubscribe;
      }, [currentUser?.userId, users]);
    
      const openChatDrawer = (user:User) => {
        setSelectedUser(user);
        setIsDrawerOpen(true);
      };

    const getInitials = (fullName: any) => {
      if (!fullName) return 'U';
      const names = fullName.trim().split(' ');
      if (names.length === 1) {
        return names[0][0].toUpperCase();
      }
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    };
  
    const formatTimestamp = (timestamp: Date) => {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString('tr-TR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else {
        return date.toLocaleDateString('tr-TR', { 
          day: '2-digit',
          month: '2-digit'
        });
      }
    };
  
    useEffect(() => {
      if (!searchTerm) {
        setFilteredUsers(users);
      } else {
        const filtered = users.filter((user : User) => 
          user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.kullaniciAdi.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredUsers(filtered);
      }
    }, [searchTerm, users]);
  
    useEffect(() => {
      fetchUsers();
    }, []);
  
    useEffect(() => {
      if (users.length > 0) {
        const unsubscribe = loadChatRooms();
        return unsubscribe;
      }
    }, [users, loadChatRooms]);
  
    return (
        <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Mesajlar</h1>
              </div>
              
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('rooms')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'rooms'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sohbet Odaları
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'users'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tüm Kullanıcılar
                </button>
              </div>
            </div>
          </div>
        </div>
  
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder={activeTab === 'rooms' ? 'Sohbetlerde ara...' : 'Kullanıcı ara...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>
        </div>
  
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          {activeTab === 'rooms' ? (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <MessageCircle className="h-6 w-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Sohbet Odaları</h2>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {chatRooms.length}
                </span>
              </div>
  
              {roomsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 rounded mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                        </div>
                      </div>
                      <div className="h-3 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : chatRooms.length === 0 ? (
                <div className="text-center py-16">
                  <MessageCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz sohbet yok</h3>
                  <p className="text-gray-500 mb-6">Yeni bir sohbet başlatmak için kullanıcılar sekmesini kullanın</p>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Kullanıcıları Görüntüle
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {chatRooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => openChatDrawer(room.user)}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {getInitials(room.user.fullName)}
                          </div>
                          {room.unreadCount > 0 && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-bold">
                                {room.unreadCount > 9 ? '9+' : room.unreadCount}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600">
                            {room.user.fullName}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">@{room.user.kullaniciAdi}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
                      </div>
                      
                      <div className="space-y-2">
                        <p className={`text-sm truncate ${
                          room.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                        }`}>
                          {room.lastMessage || 'Henüz mesaj yok'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(room.lastMessageAt)}
                          </span>
                          {room.lastMessageSenderId === currentUser.userId && (
                            <span className="text-xs text-blue-600">Siz: </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Users className="h-6 w-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Tüm Kullanıcılar</h2>
                <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {filteredUsers.length}
                </span>
              </div>
  
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 rounded mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                        </div>
                      </div>
                      <div className="h-3 bg-gray-300 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Kullanıcı bulunamadı</h3>
                  <p className="text-gray-500">Arama kriterlerinizi değiştirmeyi deneyin</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.userId}
                      onClick={() => openChatDrawer(user)}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-green-200 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {getInitials(user.fullName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate group-hover:text-green-600">
                            {user.fullName}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">@{user.kullaniciAdi}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-500" />
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        <p className="text-xs text-gray-500">Sohbet başlatmak için tıklayın</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  export default ChatPage;