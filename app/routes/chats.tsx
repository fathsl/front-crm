import { useAtomValue } from "jotai";
import { AlertCircle, ArrowLeft, Check, CheckCircle, Clock, Edit3, FileIcon, FileText, MessageSquare, Mic, Paperclip, Pause, Play, Plus, PlusIcon, Send, Square, Trash2, Users, Volume2, X, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatFileSize, MessageType, TaskPriority, TaskStatus, type SendMessageRequest, type User } from "~/help";
import type { CreateDiscussionRequest } from "~/help";
import type { Discussion } from "~/help";
import type { Message } from "~/help";
import { userAtom } from "~/utils/userAtom";

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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<MessageType | null>(null);
  const [taskContent, setTaskContent] = useState('');
  const [taskStatus, setTaskStatus] = useState(TaskStatus.Backlog);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: TaskPriority.Medium,
    dueDate: '',
    estimatedTime: '',
    assignedUsers: []
  });

  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

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

  const handleFileChange = (e : React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTaskContent(`File: ${file.name}`);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedDiscussion || !currentUser) return;
    setUploading(true);
    
    console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    const formData = new FormData();
    formData.append('discussionId', selectedDiscussion.id.toString());
    formData.append('senderId', currentUser.userId.toString());
    formData.append('receiverId', (selectedUser?.userId || 0).toString());
    formData.append('content', `File: ${file.name}`);
    formData.append('messageType', MessageType.Voice.toString());
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
        console.log('File upload response:', message);
       
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      setMediaRecorder(recorder);
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        stream.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      };
      
      recorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 49) {
            stopRecording();
            return 50;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !selectedDiscussion || !currentUser) return;
   
    const formData = new FormData();
    formData.append('discussionId', selectedDiscussion.id.toString());
    formData.append('senderId', currentUser.userId.toString());
    formData.append('receiverId', (selectedUser?.userId ?? '').toString());
    formData.append('content', 'Voice message');
    formData.append('messageType', '3');
    formData.append('duration', recordingTime.toString());
    formData.append('voiceFile', audioBlob, 'voice_message.webm');
   
    try {
      setUploading(true);
      console.log('Sending voice message with duration:', recordingTime);
     
      const response = await fetch(`${baseUrl}/api/Chat/messages/send-with-voice`, {
        method: 'POST',
        body: formData,
      });
     
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send voice message: ${error}`);
      }
     
      const result = await response.json();
      console.log('Voice message sent successfully:', result);
     
      const newVoiceMessage: Message = {
        id: result.id,
        discussionId: selectedDiscussion?.id,
        senderId: result.senderId,
        senderName: currentUser.fullName,
        content: result.content,
        messageType: result.messageType,
        isEdited: false,
        timestamp: new Date(),
        createdAt: new Date(result.createdAt),
        fileReference: result.fileReference,
        duration: result.duration || recordingTime,
        receiverId: selectedUser?.userId,
      };
     
      setMessages(prev => [...prev, newVoiceMessage]);
      setAudioBlob(null);
      setRecordingTime(0);
     
    } catch (error) {
      console.error('Error sending voice message:', error);
      alert(error instanceof Error ? error.message : 'Failed to send voice message');
    } finally {
      setUploading(false);
    }
  };

  const base64ToBlob = (base64Data: string, mimeType: string = 'audio/webm'): Blob | undefined => {
    try {
      console.log('Converting base64 to blob, input length:', base64Data.length);
  
      if (!base64Data || !base64Data.includes(',')) {
        throw new Error('Invalid base64 data format: missing comma');
      }
  
      const parts = base64Data.split(',');
      if (parts.length !== 2) {
        throw new Error('Invalid base64 data format: incorrect parts');
      }
  
      const base64String = parts[1];
      console.log('Base64 string length after split:', base64String.length);
  
      if (!base64String) {
        throw new Error('Empty base64 string');
      }
  
      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);
  
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
  
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
  
      console.log('Created blob size:', blob.size, 'type:', blob.type);
      return blob;
    } catch (error) {
      console.error('Error converting base64 to blob:', error);
      return undefined;
    }
  };

  const playVoiceMessage = async (message: Message) => {
    if (playingVoiceId === message.id) {
      setPlayingVoiceId(null);
      return;
    }
  
    let audio: HTMLAudioElement | null = null;
  
    try {
      let audioBlob: Blob | undefined;
      let audioUrl: string;
  
      if (message.audioBlob) {
        console.log('Using local audioBlob');
        audioBlob = message.audioBlob;
      }
      else if (message.fileReference && message.fileReference.startsWith('data:')) {
        console.log('Using fileReference base64 data');
        const mimeType = message.fileReference.split(';')[0].split(':')[1] || 'audio/webm';
        audioBlob = base64ToBlob(message.fileReference, mimeType);
        if (!audioBlob) {
          throw new Error('Failed to create blob from base64 data');
        }
      }
      else {
        console.log(`Fetching voice message from API for message ID: ${message.id}`);
        const response = await fetch(`${baseUrl}/api/Chat/messages/${message.id}/voice`, {
          method: 'GET',
          headers: {
            'Accept': 'audio/webm,audio/wav,audio/ogg,audio/mp3,audio/mpeg,audio/m4a',
          },
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch voice message: ${errorText}`);
        }
  
        audioBlob = await response.blob();
        if (audioBlob.size === 0) {
          throw new Error('Empty audio data received from server');
        }
  
        const mimeType = response.headers.get('Content-Type') || 'audio/webm';
        console.log('Fetched blob size:', audioBlob.size, 'type:', mimeType);
      }
  
      audio = new Audio();
      audioUrl = URL.createObjectURL(audioBlob);
      audio.src = audioUrl;
  
      console.log('Starting audio playback...');
      await audio.play();
      setPlayingVoiceId(message.id);
  
      audio.onended = () => {
        console.log('Audio playback ended');
        setPlayingVoiceId(null);
        URL.revokeObjectURL(audioUrl);
      };
  
      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setPlayingVoiceId(null);
        URL.revokeObjectURL(audioUrl);
        alert('Error playing voice message');
      };
    } catch (error) {
      console.error('Error in playVoiceMessage:', error);
      alert(error instanceof Error ? error.message : 'Failed to play voice message');
      if (audio) {
        audio.src = '';
      }
    }
  };

  const statusOptions = [
    { value: TaskStatus.Backlog, label: 'Backlog', icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
    { value: TaskStatus.Todo, label: 'Todo', icon: AlertCircle, color: 'text-blue-600 bg-blue-100' },
    { value: TaskStatus.InProgress, label: 'In Progress', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    { value: TaskStatus.InReview, label: 'In Review', icon: AlertCircle, color: 'text-violet-600 bg-violet-100' },
    { value: TaskStatus.Done, label: 'Done', icon: XCircle, color: 'text-red-600 bg-red-100' }
  ];

  const dropdownOptions = [
    { type: MessageType.Text, icon: MessageSquare, label: 'Text Task', color: 'text-blue-600 hover:bg-blue-50' },
    { type: MessageType.File, icon: FileText, label: 'File Task', color: 'text-green-600 hover:bg-green-50' },
    { type: MessageType.Voice, icon: Mic, label: 'Voice Task', color: 'text-purple-600 hover:bg-purple-50' }
  ];

  useEffect(() => {
    if (!selectedDiscussion) return;

    const interval = setInterval(() => {
      fetchMessages(selectedDiscussion.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedDiscussion, fetchMessages]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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

  const formatTime = (seconds : number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDropdownSelect = (type : MessageType) => {
    setDrawerType(type);
    setDrawerOpen(true);
    setShowDropdown(false);
    setTaskContent('');
    setSelectedFile(null);
    setAudioBlob(null);
    setTaskStatus(TaskStatus.Backlog);
  };

  const handleSendTask = async () => {
    if (!taskContent.trim() && !selectedFile && !audioBlob) return;

    const taskMessageData = {
      discussionId: selectedDiscussion?.id,
      senderId: currentUser?.userId,
      receiverId: selectedUser?.userId || null,
      content: taskContent,
      messageType: MessageType.Task,
      taskTitle: taskContent,
      taskDescription: null,
      taskStatus: taskStatus,
      taskPriority: 'Medium',
      dueDate: null,
      estimatedTime: null,
      assignedUserIds: selectedUser ? [selectedUser.userId] : []
    };

    try {
      let response;

      if (drawerType === MessageType.File && selectedFile) {
        const formData = new FormData();
        Object.keys(taskMessageData).forEach(key => {
          const typedKey = key as keyof typeof taskMessageData;
          const value = taskMessageData[typedKey];
          
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              value.forEach((item, index) => {
                formData.append(`${key}[${index}]`, item.toString());
              });
            } else {
              formData.append(key, value.toString());
            }
          }
        });
        formData.append('file', selectedFile);

        response = await fetch('/api/Chat/messages/send-task-with-file', {
          method: 'POST',
          body: formData
        });
      } else if (drawerType === MessageType.Voice && audioBlob) {
        const formData = new FormData();
        Object.keys(taskMessageData).forEach(key => {
          const typedKey = key as keyof typeof taskMessageData;
          const value = taskMessageData[typedKey];
          
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              value.forEach((item, index) => {
                formData.append(`${key}[${index}]`, item.toString());
              });
            } else {
              formData.append(key, value.toString());
            }
          }
        });
        formData.append('duration', recordingTime.toString());
        formData.append('audioFile', audioBlob, 'voice-message.webm');

        response = await fetch('/api/Chat/messages/send-task-with-voice', {
          method: 'POST',
          body: formData
        });
      } else {
        response = await fetch('/api/Chat/messages/send-with-task', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(taskMessageData)
        });
      }

      if (response.ok) {
        const result = await response.json();
        console.log('Task message sent:', result);
        setDrawerOpen(false);
        setDrawerType(null);
        setTaskContent('');
        setSelectedFile(null);
        setAudioBlob(null);
        setRecordingTime(0);
        setTaskStatus(TaskStatus.Backlog);
        
        alert('Task message sent successfully!');
      } else {
        throw new Error('Failed to send task message');
      }
    } catch (error) {
      console.error('Error sending task message:', error);
      alert('Failed to send task message');
    }
  };

  const closeDrawer = () => {
    if (isRecording) {
      cancelRecording();
    }
    setDrawerOpen(false);
    setDrawerType(null);
    setTaskContent('');
    setSelectedFile(null);
    setAudioBlob(null);
    setRecordingTime(0);
    setTaskStatus(TaskStatus.Backlog);
  };

  const getStatusOption = (status : string) => {
    return statusOptions.find(option => option.value === status) || statusOptions[0];
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className={`
        ${currentView === "users" ? "flex" : "hidden"}
        lg:flex flex-col w-full lg:w-80 bg-white/90 backdrop-blur-sm border-r border-slate-200/60 shadow-lg
      `}>
        <div className="p-6 border-b border-slate-200/60 bg-gradient-to-r from-blue-600 to-purple-600">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Users className="mr-3 text-blue-100" size={24} />
            Contacts
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.userId}
              onClick={() => handleUserSelect(user)}
              className={`p-4 cursor-pointer border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${
                selectedUser?.userId === user.userId
                  ? "bg-gradient-to-r from-blue-100 to-purple-100 border-blue-200"
                  : ""
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {user.kullaniciAdi[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 truncate">
                    {user.kullaniciAdi}
                  </div>
                  {user.email && (
                    <div className="text-sm text-slate-500 truncate">{user.email}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`
        ${currentView === "discussions" ? "flex" : "hidden"}
        ${selectedUser ? "lg:flex" : "lg:hidden"}
        flex-col w-full lg:w-96 bg-white/90 backdrop-blur-sm border-r border-slate-200/60
      `}>
        <div className="p-4 border-b border-slate-200/60 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-between">
          <div className="flex items-center text-white">
            <button
              onClick={goBack}
              className="mr-3 p-2 hover:bg-white/20 rounded-full transition lg:hidden"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-lg font-bold">
              {selectedUser?.kullaniciAdi || "Discussions"}
            </h2>
          </div>
          <button
            onClick={() => setShowCreateDiscussion(true)}
            className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition flex items-center backdrop-blur-sm"
          >
            <Plus className="mr-1" size={16} />
            <span className="hidden md:inline">New</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="text-center py-8 text-slate-500">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2">Loading...</p>
            </div>
          ) : discussions.length > 0 ? (
            <div className="space-y-3">
              {discussions.map((discussion) => (
                <div
                  key={discussion.id}
                  onClick={() => handleDiscussionSelect(discussion)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all duration-200 hover:shadow-md ${
                    selectedDiscussion?.id === discussion.id
                      ? "bg-gradient-to-r from-blue-100 to-purple-100 border-blue-300 shadow-md"
                      : "bg-white/80 hover:bg-white/90 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="font-semibold text-slate-800 mb-1">
                    {discussion.title}
                  </div>
                  <div className="text-sm text-slate-600 mb-2 line-clamp-2">
                    {discussion.description}
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatDate(discussion.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <MessageSquare size={48} className="mx-auto mb-3 opacity-40" />
              <p>No discussions yet</p>
            </div>
          )}
        </div>
      </div>

      <div className={`
        ${currentView === "chat" ? "flex" : "hidden"}
        ${selectedDiscussion ? "lg:flex" : "lg:hidden"}
        flex-col w-full lg:flex-1 bg-white/90 backdrop-blur-sm
      `}>
        <div className="border-b border-slate-200/60 p-4 bg-gradient-to-r from-pink-600 to-orange-500 flex items-center">
          <button
            onClick={goBack}
            className="mr-3 p-2 hover:bg-white/20 rounded-full text-white transition lg:hidden"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold">
              {selectedUser?.kullaniciAdi?.[0]}
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                {selectedDiscussion?.title}
              </h1>
              <p className="text-sm text-white/80">
                Chat with {selectedUser?.kullaniciAdi}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50/80 to-white/80">
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
                className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl shadow-md backdrop-blur-sm ${
                  message.senderId === currentUser?.userId
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    : "bg-white/90 border border-slate-200 text-slate-800"
                }`}
              >
                <div className="text-xs opacity-75 mb-2">
                  {message.senderName} • {formatDate(message.createdAt || new Date())}
                  {message.isEdited && " (edited)"}
                </div>
                
                {editingMessageId === message.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full p-2 border rounded text-slate-800 text-sm"
                      rows={2}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => editMessage(message.id, editingContent)}
                        className="p-1 bg-green-500 text-white rounded"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingMessageId(null);
                          setEditingContent("");
                        }}
                        className="p-1 bg-slate-400 text-white rounded"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                   {message.messageType === MessageType.Voice ? (
                    <div className="flex items-center space-x-3 py-2">
                      <button
                        onClick={() => playVoiceMessage(message)}
                        className={`p-2 rounded-full transition ${
                          message.senderId === currentUser?.userId
                            ? 'bg-white/20 hover:bg-white/30 text-white'
                            : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                        }`}
                        disabled={!message.fileReference && !message.audioBlob}
                      >
                        {playingVoiceId === message.id ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <div className="flex items-center space-x-2">
                        <Volume2 size={16} className="opacity-70" />
                        <span className="text-sm">{formatTime(message.duration || 0)}</span>
                      </div>
                      {process.env.NODE_ENV === 'development' && (
                        <span className="text-xs opacity-50">
                          {message.fileReference ? '(Server)' : message.audioBlob ? '(Local)' : '(No Audio)'}
                        </span>
                      )}
                    </div>
                    ) : message.messageType === MessageType.File ? (
                      <div className="inline-flex items-center">
                        <FileIcon className="mr-2" size={16} />
                        {message.fileName}
                        {message.fileSize && (
                          <span className="ml-2 text-sm opacity-75">
                            ({formatFileSize(message.fileSize)})
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}

                  {message.senderId === currentUser?.userId && (message.messageType === MessageType.Text || message.messageType === MessageType.Voice) && (
                    <div className="flex space-x-2 mt-2 text-xs opacity-75">
                      <button
                        onClick={() => {
                          setEditingMessageId(message.id);
                          setEditingContent(message.content || '');
                        }}
                        className="hover:text-blue-200"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={() => deleteMessage(message.id)}
                        className="hover:text-red-300"
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

        <div className="border-t border-slate-200/60 p-4 bg-white/90 backdrop-blur-sm">
          <div className="flex items-end space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
              disabled={uploading || isRecording}
            >
              <Paperclip size={20} />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading || isRecording}
              />
            </button>
            
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-3 rounded-full transition-all duration-200 ${
                isRecording 
                  ? "bg-red-500 text-white animate-pulse" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
              disabled={uploading}
            >
              {isRecording ? <Square size={20} /> : <Mic size={20} />}
            </button>

            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-3 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
            >
              <Plus size={20} />
            </button>

            {showDropdown && (
              <div className="absolute bottom-full mb-2 left-0 bg-white rounded-xl shadow-lg border border-slate-200 py-2 min-w-[160px] z-50">
                {dropdownOptions.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => handleDropdownSelect(option.type)}
                    className={`w-full flex items-center px-4 py-3 text-sm transition ${option.color}`}
                  >
                    <option.icon size={16} className="mr-3" />
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex-1 relative">
              {isRecording && (
                <div className="absolute bottom-16 left-0 right-0 bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-600 font-medium">
                        Recording: {formatTime(recordingTime)}
                      </span>
                      <div className="text-sm text-red-500">
                        ({50 - recordingTime}s remaining)
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={cancelRecording}
                        className="p-2 text-red-500 hover:text-red-700 transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {audioBlob && !isRecording && (
                <div className="absolute bottom-16 left-0 right-0 bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Volume2 className="text-blue-600" size={20} />
                      <span className="text-blue-800 font-medium">
                        Voice message ({formatTime(recordingTime)})
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={sendVoiceMessage}
                        disabled={uploading}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                      >
                        Send
                      </button>
                      <button
                        onClick={() => setAudioBlob(null)}
                        className="p-1 text-blue-500 hover:text-blue-700 transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedFile && (
                <div className="absolute bottom-16 left-0 bg-slate-50 p-3 rounded-xl shadow-md border border-slate-300 min-w-64 max-w-full backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <FileIcon className="text-blue-500 flex-shrink-0" size={20} />
                      <span className="text-sm truncate">{selectedFile.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-slate-500 hover:text-red-500 transition ml-2"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  {uploading && (
                    <div className="text-xs text-slate-500 mt-2">Uploading...</div>
                  )}
                </div>
              )}
              
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isRecording ? "Recording voice message..." : "Type your message..."}
                className="w-full p-4 pr-12 border border-slate-300 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-200"
                rows={1}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={uploading || isRecording}
              />
            </div>
            
            <button
              onClick={sendMessage}
              disabled={(!newMessage.trim() && !selectedFile) || uploading || isRecording}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-2xl hover:from-blue-600 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
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
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={40} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Welcome to Chat</h3>
            <p className="text-slate-500">Select a contact to start messaging</p>
          </div>
        </div>
      )}
      
      {selectedUser && !selectedDiscussion && (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={40} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Select a Discussion</h3>
            <p className="text-slate-500">Choose a conversation to start chatting</p>
          </div>
        </div>
      )}

      {showCreateDiscussion && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-slate-800">New Discussion</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newDiscussionTitle}
                onChange={(e) => setNewDiscussionTitle(e.target.value)}
                className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Discussion title"
              />
              <textarea
                value={newDiscussionDescription}
                onChange={(e) => setNewDiscussionDescription(e.target.value)}
                className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                rows={3}
                placeholder="Description (optional)"
              />
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={createDiscussion}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition font-medium"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateDiscussion(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl hover:bg-slate-200 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                {drawerType === MessageType.Text && <MessageSquare size={20} className="text-blue-600" />}
                {drawerType === MessageType.File && <FileText size={20} className="text-green-600" />}
                {drawerType === MessageType.Voice && <Mic size={20} className="text-purple-600" />}
                <h3 className="font-semibold text-lg">
                  Create {drawerType === MessageType.Text ? 'Text' : drawerType === MessageType.File ? 'File' : 'Voice'} Task
                </h3>
              </div>
              <button
                onClick={closeDrawer}
                className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Task Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setTaskStatus(option.value)}
                        className={`flex items-center p-3 rounded-lg border-2 transition ${
                          taskStatus === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`p-1 rounded ${option.color} mr-3`}>
                          <IconComponent size={16} />
                        </div>
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-sm text-slate-600">Assigned to:</div>
                <div className="font-medium text-slate-900">
                  {selectedUser?.firstName + ' ' + selectedUser?.lastName || 'No assignee selected'}
                </div>
              </div>

              {drawerType === MessageType.Text && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Task Content
                  </label>
                  <textarea
                    value={taskContent}
                    onChange={(e) => setTaskContent(e.target.value)}
                    placeholder="Describe the task..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={4}
                  />
                </div>
              )}

              {drawerType === MessageType.File && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload File
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-slate-400 transition"
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center space-x-2">
                        <FileText size={20} className="text-green-600" />
                        <span className="font-medium">{selectedFile.name}</span>
                      </div>
                    ) : (
                      <div>
                        <Paperclip size={24} className="mx-auto text-slate-400 mb-2" />
                        <p className="text-slate-600">Click to select file</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}

              {drawerType === MessageType.Voice && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Voice Recording
                  </label>
                  <div className="space-y-4">
                    {!audioBlob ? (
                      <div className="text-center">
                        {isRecording ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center justify-center space-x-3 mb-3">
                              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="text-red-600 font-medium">
                                Recording: {formatTime(recordingTime)}
                              </span>
                            </div>
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={stopRecording}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center space-x-2"
                              >
                                <Square size={16} />
                                <span>Stop</span>
                              </button>
                              <button
                                onClick={cancelRecording}
                                className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={startRecording}
                            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition flex items-center space-x-2 mx-auto"
                          >
                            <Mic size={20} />
                            <span>Start Recording</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-center space-x-3">
                          <Volume2 size={20} className="text-green-600" />
                          <span className="font-medium">Recording ready: {formatTime(recordingTime)}</span>
                          <button
                            onClick={() => {
                              setAudioBlob(null);
                              setRecordingTime(0);
                              setTaskContent('');
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-4">
              <div className="flex justify-between">
                <button
                  onClick={closeDrawer}
                  className="px-6 py-3 text-slate-600 hover:text-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendTask}
                  disabled={!taskContent.trim() && !selectedFile && !audioBlob}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center space-x-2"
                >
                  <Send size={16} />
                  <span>Send Task</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatApplication;