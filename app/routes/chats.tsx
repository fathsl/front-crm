import { useAtomValue } from "jotai";
import { ArrowLeft, Check, Edit3, FileIcon, MessageSquare, Paperclip, Plus, PlusIcon, Send, Trash2, Users, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageType, type SendMessageRequest, type User } from "~/help";
import type { CreateDiscussionRequest } from "~/help";
import type { Discussion } from "~/help";
import type { Message } from "~/help";
import { userAtom } from "~/utils/userAtom";

interface FileAttachment {
    id?: number;
    fileName: string;
    originalFileName: string;
    fileSize?: number;
    mimeType?: string;
    filePath?: string;
    uploadedAt?: string;
  }

const ChatApplication: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const currentUser = useAtomValue(userAtom);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showCreateDiscussion, setShowCreateDiscussion] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
  const [newDiscussionDescription, setNewDiscussionDescription] = useState('');
  const [currentView, setCurrentView] = useState('users');
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [error, setError] = useState('');

  const baseUrl = "http://localhost:5178";

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/User`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        console.log("userrss",data);
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchDiscussions = useCallback(async (userId: number) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/Chat/discussions/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setDiscussions(data);
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (discussionId: number) => {
    try {
      const response = await fetch(`${baseUrl}/api/Chat/discussions/${discussionId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  const createDiscussion = async () => {
    if (!selectedUser || !newDiscussionTitle.trim()) return;
  
    const request: CreateDiscussionRequest = {
      title: newDiscussionTitle,
      description: newDiscussionDescription,
      createdByUserId: currentUser?.userId || 0,
      participantUserIds: [currentUser?.userId || 0, selectedUser.userId]
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
        setDiscussions(prev => [newDiscussion, ...prev]);
        setNewDiscussionTitle('');
        setNewDiscussionDescription('');
        setShowCreateDiscussion(false);
        setSelectedDiscussion(newDiscussion);
      }
    } catch (error) {
      console.error('Error creating discussion:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedDiscussion || !currentUser) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('discussionId', selectedDiscussion.id.toString());
    formData.append('senderId', currentUser.userId.toString());
    formData.append('receiverId', (selectedUser?.userId || 0).toString());
    formData.append('content', `File: ${file.name}`);
    formData.append('messageType', MessageType.File.toString());
    formData.append('file', file);
  
    try {
        const response = await fetch(`${baseUrl}/api/Chat/messages/send-with-file`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'File upload failed');
        }
        
        const message = await response.json();
        
        setMessages(prev => [...prev, message]);
        
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSelectedFile(null);
        
    } catch (error) {
        console.error('Error uploading file:', error);
    } finally {
        setUploading(false);
    }
};


  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedDiscussion || !currentUser) return;
  
    if (selectedFile) {
      await handleFileUpload(selectedFile);
      return;
    }
  
    const request: SendMessageRequest = {
      discussionId: selectedDiscussion.id,
      senderId: currentUser.userId,
      receiverId: selectedUser?.userId || 0,
      content: newMessage,
      messageType: MessageType.Text
    };
  
    try {
      const response = await fetch(`${baseUrl}/api/Chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
  
      if (response.ok) {
        setNewMessage('');
        await fetchMessages(selectedDiscussion.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const editMessage = async (messageId: number, content: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/Chat/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser?.userId || 0,
          content: content
        })
      });

      if (response.ok) {
        const updatedMessage = await response.json();
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? updatedMessage : msg
        ));
        setEditingMessageId(null);
        setEditingContent('');
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const deleteMessage = async (messageId: number) => {
    try {
      const response = await fetch(`${baseUrl}/api/Chat/messages/${messageId}?userId=${currentUser?.userId || 0}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setSelectedDiscussion(null);
    setMessages([]);
    fetchDiscussions(user.userId);
    setCurrentView('discussions');
  };

  const handleDiscussionSelect = (discussion: Discussion) => {
    setSelectedDiscussion(discussion);
    fetchMessages(discussion.id);
    setCurrentView('chat');
  };

  useEffect(() => {
    if (!selectedDiscussion) return;

    const interval = setInterval(() => {
      fetchMessages(selectedDiscussion.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedDiscussion, fetchMessages]);

  const goBack = () => {
    if (currentView === 'chat') {
      setCurrentView('discussions');
      setSelectedDiscussion(null);
    } else if (currentView === 'discussions') {
      setCurrentView('users');
      setSelectedUser(null);
    }
  };

  const formatDate = (dateString: Date) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div
        className={`
          ${currentView === "users" ? "flex" : "hidden"}
          md:flex
          flex-col
          w-full md:w-1/4
          bg-white border-r border-gray-200
        `}
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <Users className="mr-2 text-blue-500" size={20} />
            Users
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.userId}
              onClick={() => handleUserSelect(user)}
              className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                selectedUser?.userId === user.userId
                  ? "bg-blue-100 border-blue-300"
                  : ""
              }`}
            >
              <div className="font-medium text-gray-900">
                {user.kullaniciAdi}
              </div>
              {user.email && (
                <div className="text-sm text-gray-500">{user.email}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        className={`
          ${currentView === "discussions" ? "flex" : "hidden"}
          ${selectedUser ? "md:flex" : "md:hidden"}
          flex-col
          w-full md:w-1/3
          bg-white border-r border-gray-200
        `}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={goBack}
              className="mr-3 p-2 hover:bg-gray-100 rounded-full md:hidden"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-lg font-bold text-gray-800">
              {selectedUser?.kullaniciAdi || "Discussions"}
            </h2>
          </div>
          <button
            onClick={() => setShowCreateDiscussion(true)}
            className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 flex items-center"
          >
            <Plus className="mr-1" size={16} />
            <span className="hidden md:inline">New</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="text-center py-6 text-gray-500">Loading...</div>
          ) : discussions.length > 0 ? (
            <div className="space-y-3">
              {discussions.map((discussion) => (
                <div
                  key={discussion.id}
                  onClick={() => handleDiscussionSelect(discussion)}
                  className={`p-4 rounded-lg cursor-pointer border transition ${
                    selectedDiscussion?.id === discussion.id
                      ? "bg-blue-100 border-blue-300"
                      : "bg-gray-50 hover:bg-gray-100 border-gray-200"
                  }`}
                >
                  <div className="font-semibold text-gray-900">
                    {discussion.title}
                  </div>
                  <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {discussion.description}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatDate(discussion.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <MessageSquare size={40} className="mx-auto mb-2 opacity-40" />
              No discussions yet
            </div>
          )}
        </div>
      </div>

      <div
        className={`
          ${currentView === "chat" ? "flex" : "hidden"}
          ${selectedDiscussion ? "md:flex" : "md:hidden"}
          flex-col w-full md:flex-1 bg-white
        `}
      >
        <div className="border-b border-gray-200 p-4 flex items-center">
          <button
            onClick={goBack}
            className="mr-3 p-2 hover:bg-gray-100 rounded-full md:hidden"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              {selectedDiscussion?.title}
            </h1>
            <p className="text-sm text-gray-500">
              Chat with {selectedUser?.kullaniciAdi}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === currentUser?.userId
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl shadow ${
                  message.senderId === currentUser?.userId
                    ? "bg-blue-500 text-white"
                    : "bg-white border border-gray-200 text-gray-800"
                }`}
              >
                <div className="text-xs opacity-75 mb-1">
                  {message.senderName} • {formatDate(message.createdAt || new Date())}
                  {message.isEdited && " (edited)"}
                </div>
                {editingMessageId === message.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full p-2 border rounded text-gray-800 text-sm"
                      rows={2}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          editMessage(message.id, editingContent)
                        }
                        className="p-1 bg-green-500 text-white rounded"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingMessageId(null);
                          setEditingContent("");
                        }}
                        className="p-1 bg-gray-400 text-white rounded"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {message.messageType === MessageType.File ? (
                        message.fileReference ? (
                            <a
                            href={`${baseUrl}/api/Chat/files${message.fileReference}`}
                            download
                            className="inline-flex items-center text-blue-600 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                            >
                            <FileIcon className="mr-2" size={16} />
                            {message.content?.replace('File: ', '')}
                            </a>
                        ) : (
                            <div className="inline-flex items-center text-gray-500">
                            <FileIcon className="mr-2" size={16} />
                            {message.content?.replace('File: ', '')} (File not available)
                            </div>
                        )
                        ) : (
                        <p>{message.content}</p>
                        )}

                    {message.senderId === currentUser?.userId && (
                      <div className="flex space-x-2 mt-1 text-xs opacity-75">
                        <button
                          onClick={() => {
                            setEditingMessageId(message.id);
                            setEditingContent(message.content || "");
                          }}
                          className="hover:text-blue-600"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => deleteMessage(message.id)}
                          className="hover:text-red-600"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 p-3">
          <div className="flex items-end space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            disabled={uploading}
            type="button"
            >
            <Paperclip size={20} />
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
            />
            </button>
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full p-3 pr-12 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500"
                rows={1}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={uploading}
              />
              {selectedFile && (
                <div className="absolute bottom-14 left-0 bg-gray-50 p-3 rounded-xl shadow-md border border-gray-300 w-64">
                    <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 overflow-hidden">
                        <FileIcon className="text-blue-500" size={20} />
                        <span className="text-sm truncate">{selectedFile.name}</span>
                    </div>
                    <button
                        onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-gray-500 hover:text-red-500 transition"
                    >
                        <X size={18} />
                    </button>
                    </div>
                    {uploading && <div className="text-xs text-gray-500 mt-2">Uploading...</div>}
                </div>
                )}
            </div>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() && !selectedFile}
              className="bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>

      {!selectedUser && (
        <div className="hidden md:flex flex-1 items-center justify-center bg-white text-gray-500">
          <div className="text-center">
            <Users size={40} className="mx-auto mb-2 opacity-40" />
            <p>Select a user to view discussions</p>
          </div>
        </div>
      )}
      {selectedUser && !selectedDiscussion && (
        <div className="hidden md:flex flex-1 items-center justify-center bg-white text-gray-500">
          <div className="text-center">
            <MessageSquare size={40} className="mx-auto mb-2 opacity-40" />
            <p>Select a discussion to start chatting</p>
          </div>
        </div>
      )}

      {showCreateDiscussion && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-4">New Discussion</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newDiscussionTitle}
                onChange={(e) => setNewDiscussionTitle(e.target.value)}
                className="w-full p-3 border rounded-lg"
                placeholder="Title"
              />
              <textarea
                value={newDiscussionDescription}
                onChange={(e) => setNewDiscussionDescription(e.target.value)}
                className="w-full p-3 border rounded-lg"
                rows={3}
                placeholder="Description"
              />
            </div>
            <div className="flex space-x-3 mt-5">
              <button
                onClick={createDiscussion}
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateDiscussion(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApplication;