import { useAtomValue } from "jotai";
import { AlertCircle, ArrowLeft, CheckCircle, Clock, DownloadIcon, Edit3, ExternalLink, FileIcon, FileText, ListChecksIcon, MessageSquare, Mic, MoreVertical, Paperclip, Pause, Play, Plus, Search, Send, Share, Square, Trash2, Users, Volume2, X, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react"; 
import { formatFileSize, IDRIVE_CONFIG, MessageType, type SendMessageRequest, type User } from "~/help";
import type { Client, CreateDiscussionRequest, Project } from "~/help";
import type { Discussion } from "~/help";
import type { Message } from "~/help";
import { userAtom } from "~/utils/userAtom";
import { TaskMessage, TaskStatus } from "~/components/TaskMessage";
import { TaskPriority } from '~/types/task';      
import { useNavigate } from "react-router";

interface MessageResponse {
  id: number;
  discussionId: number;
  senderId: number;
  receiverId?: number;
  content: string;
  messageType: number;
  taskId?: number;
  taskTitle?: string;
  taskDescription?: string;
  taskStatus?: TaskStatus;
  taskPriority?: TaskPriority;
  dueDate?: Date | null;
  estimatedTime?: string;
  assignedUserIds?: number[];
  fileReference?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
  createdAt: Date;
  timestamp: string;
}

const ChatApplication: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const currentUser = useAtomValue(userAtom) as unknown as User;
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
  const [drawerType, setDrawerType] = useState<MessageType>(MessageType.Text);
  const [taskContent, setTaskContent] = useState('');
  const [taskStatus, setTaskStatus] = useState(TaskStatus.Backlog);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [taskDrawerType, setTaskDrawerType] = useState<MessageType | null>(null);
  const [taskFile, setTaskFile] = useState<File | null>(null);
  const [taskAudioBlob, setTaskAudioBlob] = useState<Blob | null>(null);
  const [taskRecording, setTaskRecording] = useState(false);
  const [taskRecordingTime, setTaskRecordingTime] = useState(0);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [selectedClients, setSelectedClients] = useState<Client[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  const [sending, setSending] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: TaskPriority.Medium,
    dueDate: '',
    estimatedTime: '',
    assignedUsers: [],
    discussionId: '',
    senderId: '',
    receiverId: '',
    content: '',
    messageType: '',
    taskTitle: '',
    taskStatus: '',
    taskPriority: '',
    assignedUserIds: []
  });

  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const taskAudioStreamRef = useRef<MediaStream | null>(null);
  const taskRecordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [taskMediaRecorder, setTaskMediaRecorder] = useState<MediaRecorder | null>(null);
  const isRecordingCanceled = useRef(false);
  const navigate = useNavigate();
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
  
    const fetchProjects = async () => {
        try {
          const response = await fetch('http://localhost:5178/api/Project');
          const data = await response.json();
          setProjects(data);
        } catch (error) {
          console.error('Projects fetch error:', error);
        }
      };
    
      useEffect(() => {
        fetchProjects();
      }, []);

  useEffect(() => {
    fetchUsers();
    fetchClients();
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
    if (!selectedDiscussion || !currentUser) {
        console.error('Missing selectedDiscussion or currentUser');
        alert('Please select a discussion and ensure you are logged in');
        return;
    }
    
    setUploading(true);
   
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('discussionId', selectedDiscussion.id.toString());
        formData.append('senderId', currentUser.userId.toString());
        formData.append('receiverId', (selectedUser?.userId || 0).toString());
        formData.append('content', `File: ${file.name}`);
        formData.append('messageType', MessageType.File.toString());
        formData.append('fileName', file.name);
        formData.append('originalFileName', file.name);
        formData.append('fileSize', file.size.toString());
        formData.append('mimeType', file.type || 'application/octet-stream');
       
        formData.append('bucketName', 'chat-files');
        formData.append('fileKey', `${Date.now()}_${file.name}`);
        formData.append('fileReference', `ref_${Date.now()}_${file.name}`);
        formData.append('idriveUrl', '');
       
        const response = await fetch(`${baseUrl}/api/Chat/messages/send-with-file`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            let errorMessage = 'File upload failed';
            try {
                const errorData = await response.json();
                console.error('Error response data:', errorData);
                errorMessage = errorData.message || errorData.error || errorMessage;
                
                if (errorData.stackTrace) {
                    console.error('Server stack trace:', errorData.stackTrace);
                }
            } catch (parseError) {
                try {
                    const errorText = await response.text();
                    console.error('Error response text:', errorText);
                    errorMessage = errorText || errorMessage;
                } catch {
                    console.error('Could not parse error response');
                }
            }
            throw new Error(`${response.status}: ${errorMessage}`);
        }
       
        const message = await response.json();
        console.log('File message saved successfully:', message);
       
        setMessages(prev => [...prev, message]);
       
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSelectedFile(null);

        console.log('File uploaded successfully!');
       
    } catch (error) {
        console.error('Error uploading file:', error);
        
        if (error instanceof TypeError && error.message.includes('fetch')) {
            alert('Network error: Could not connect to server. Please check your connection.');
        }else {
            alert('Failed to upload file: ' + (error as Error).message);
        }
    } finally {
        setUploading(false);
    }
};

  const handleTaskSend = async () => {
    if ((!taskContent.trim() && !taskFile && !taskAudioBlob) || !selectedDiscussion || !currentUser) {
      console.error('Missing required fields for task message');
      return;
    }
    
    setSending(true);
    
    interface TaskMessagePayload {
      title: string;
      description: string;
      priority: TaskPriority;
      dueDate: string | null;
      assignedUsers: number[];
      discussionId: number;
      senderId: number;
      receiverId: number | null;
      content: string;
      messageType: MessageType;
      taskStatus: TaskStatus;
      taskTitle: string;
      fileSize?: number;
      fileName?: string;
      fileType?: string;
      duration?: number;
    }

    try {
      const taskTitle = taskContent.split('\n')[0].substring(0, 100);
      const baseMessage: TaskMessagePayload = {
        title: taskTitle,
        description: taskContent,
        priority: TaskPriority.Medium,
        dueDate: null,
        assignedUsers: [],
        discussionId: selectedDiscussion.id,
        senderId: currentUser.userId,
        receiverId: selectedUser?.userId || null,
        content: taskContent,
        messageType: MessageType.Task,
        taskStatus: taskStatus,
        taskTitle: taskTitle
      };

      let response: Response;

      if (taskFile) {
        const formData = new FormData();
        const messageData: TaskMessagePayload = {
          ...baseMessage,
          fileSize: taskFile.size,
          fileName: taskFile.name,
          fileType: taskFile.type
        };
        formData.append('message', JSON.stringify(messageData));
        formData.append('file', taskFile);
        
        response = await fetch(`${baseUrl}/api/Chat/messages/send-with-file`, {
          method: 'POST',
          body: formData
        });
      } else if (taskAudioBlob) {
        const formData = new FormData();
        const messageData: TaskMessagePayload = {
          ...baseMessage,
          duration: Math.floor(taskRecordingTime / 1000),
          fileSize: taskAudioBlob.size,
          fileName: 'voice-message.webm',
          fileType: 'audio/webm'
        };
        formData.append('message', JSON.stringify(messageData));
        formData.append('audioFile', taskAudioBlob, 'voice-message.webm');
        
        response = await fetch(`${baseUrl}/api/Chat/messages/send-with-voice`, {
          method: 'POST',
          body: formData
        });
      } else {
        response = await fetch(`${baseUrl}/api/Chat/messages/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...baseMessage,
            messageType: MessageType.Task
          })
        });
      }
  
      if (response.ok) {
        const result = await response.json();
        setMessages(prev => [...prev, {
          ...result,
          taskId: result.id,
          taskTitle: result.taskTitle || taskContent.split('\n')[0].substring(0, 100),
          taskStatus: result.taskStatus || TaskStatus.Backlog,
          taskPriority: result.taskPriority || TaskPriority.Medium,
          assignedUserIds: result.assignedUserIds || [],
          senderName: result.senderName || currentUser?.email || 'User',
          isEdited: false,
          timestamp: result.timestamp || new Date().toISOString()
        }]);
        
        setTaskContent('');
        setTaskFile(null);
        setTaskAudioBlob(null);
        setTaskStatus(TaskStatus.Backlog);
        closeTaskDrawer();
      } else {
        const errorText = await response.text();
        console.error('Server response:', response.status, errorText);
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Error sending task message:', error);
      alert('Failed to send task. Please try again.');
    } finally {
      setSending(false);
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
      setIsRecording(true);
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
    setIsRecording(false);
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
    
    try {
        setUploading(true);
        const voiceFileName = `voice_${Date.now()}.webm`;
        const audioFile = new File([audioBlob], voiceFileName, {
            type: 'audio/webm'
        });

        const formData = new FormData();
        formData.append('audioFile', audioBlob, voiceFileName);
        formData.append('discussionId', selectedDiscussion.id.toString());
        formData.append('senderId', currentUser.userId.toString());
        formData.append('receiverId', (selectedUser?.userId || 0).toString());
        formData.append('content', 'Voice message');
        formData.append('messageType', '3');
        formData.append('fileName', voiceFileName);
        formData.append('originalFileName', voiceFileName);
        formData.append('fileSize', audioFile.size.toString());
        formData.append('mimeType', audioFile.type);
        formData.append('duration', Math.round(recordingTime).toString());
        formData.append('bucketName', 'voice-messages');
        formData.append('fileKey', `voice_${Date.now()}_${voiceFileName}`);
        formData.append('fileReference', `voice_ref_${Date.now()}_${voiceFileName}`);
        
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
            assignedUserIds: [],
            idriveUrl: result.idriveUrl,
            fileName: result.fileName,
            mimeType: result.mimeType
        };
       
      setMessages(prev => [...prev, newVoiceMessage]);
      setAudioBlob(null);
      setRecordingTime(0);
        
      } catch (error) {
          console.error('Error uploading voice message:', error);
          alert('Failed to send voice message: ' + (error as Error).message);
      } finally {
          setUploading(false);
      }
  };

  const playVoiceMessage = async (message: Message) => {
    if (playingVoiceId === message.id) {
      pauseVoiceMessage(message);
      return;
    }
  
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
  
    try {
      let audioUrl: string;
  
      if (message.audioBlob) {
        console.log('Using local audioBlob');
        audioUrl = URL.createObjectURL(message.audioBlob);
      } else {
        console.log(`Fetching voice message URL for message ID: ${message.id}`);
        const response = await fetch(`${baseUrl}/api/Chat/messages/${message.id}/voice`, {
          method: 'GET'
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch voice message: ${errorText}`);
        }
  
        const data = await response.json();
        audioUrl = data.audioUrl;
        
        if (!audioUrl) {
          throw new Error('No audio URL received from server');
        }
      }
  
      const audio = new Audio();
      audio.src = audioUrl;
      audioRef.current = audio;
  
      console.log('Starting audio playback...');
      await audio.play();
      setPlayingVoiceId(message.id);
  
      audio.onended = () => {
        console.log('Audio playback ended');
        setPlayingVoiceId(null);
        if (message.audioBlob) {
          URL.revokeObjectURL(audioUrl);
        }
        audioRef.current = null;
      };
  
      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setPlayingVoiceId(null);
        if (message.audioBlob) {
          URL.revokeObjectURL(audioUrl);
        }
        audioRef.current = null;
        alert('Error playing voice message');
      };
    } catch (error) {
      console.error('Error in playVoiceMessage:', error);
      alert(error instanceof Error ? error.message : 'Failed to play voice message');
      audioRef.current = null;
    }
  };

  const pauseVoiceMessage = (message: Message) => {
    if (playingVoiceId === message.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingVoiceId(null);
    }
  };
  
  const stopVoiceMessage = (message: Message) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
      setPlayingVoiceId(null);
    }
  };

  const downloadFile = async (messageId: number, fileName: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/Chat/messages/${messageId}/file`, {
        method: 'GET'
      });
  
      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }
  
      const data = await response.json();
      
      window.open(data.downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  const statusOptions = [
    { value: TaskStatus.Backlog, label: 'Backlog', icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
    { value: TaskStatus.ToDo, label: 'Todo', icon: AlertCircle, color: 'text-blue-600 bg-blue-100' },
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

  const handleTaskDropdownSelect = (type : MessageType) => {
    setTaskDrawerType(type);
    setTaskDrawerOpen(true);
    setShowTaskDropdown(false);
    setTaskContent('');
    setTaskFile(null);
    setTaskAudioBlob(null);
    setTaskStatus(TaskStatus.Backlog);
  };

  const handleTaskFileChange = (e : React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTaskFile(file);
      setTaskContent(`File: ${file.name}`);
    }
  };

  const handleSendTask = async (
    taskContent: string,
    taskFile: File | null,
    taskAudioBlob: Blob | null,
    taskRecordingTime: number,
    taskDrawerType: MessageType,
    taskStatus: TaskStatus,
    selectedDiscussion: Discussion | null,
    currentUser: User | null,
    selectedUser: User | null,
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    closeTaskDrawer: () => void,
    baseUrl: string,
    clientIds: number[],
    projectIds: number[],
  ) => {
    if (!taskContent.trim() && !taskFile && !taskAudioBlob) return;
  
    const taskMessageData = {
      discussionId: selectedDiscussion?.id ?? 0,
      senderId: currentUser?.userId ?? 0,
      receiverId: selectedUser?.userId || null,
      content: taskContent,
      messageType: MessageType.Task,
      taskTitle: taskContent,
      taskDescription: null,
      taskStatus: taskStatus,
      taskPriority: TaskPriority.Medium,
      dueDate: null,
      estimatedTime: null,
      assignedUserIds: selectedUser ? [selectedUser.userId] : [],
      clientIds: clientIds,
      projectIds: projectIds,
    };
  
    try {
      let response: Response;
      if (taskDrawerType === MessageType.File && taskFile) {
        const formData = new FormData();
        (Object.keys(taskMessageData) as (keyof typeof taskMessageData)[]).forEach(key => {
          const value = taskMessageData[key];
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              value.forEach((item, index) => {
                formData.append(`${String(key)}[${index}]`, item.toString());
              });
            } else {
              formData.append(String(key), value.toString());
            }
          }
        });
        formData.append('file', taskFile);
        response = await fetch(`${baseUrl}/api/Chat/messages/send-task-with-file`, {
          method: 'POST',
          body: formData
        });
      } else if (taskDrawerType === MessageType.Voice && taskAudioBlob) {
        const formData = new FormData();
        (Object.keys(taskMessageData) as (keyof typeof taskMessageData)[]).forEach(key => {
          const value = taskMessageData[key];
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              value.forEach((item, index) => {
                formData.append(`${String(key)}[${index}]`, item.toString());
              });
            } else {
              formData.append(String(key), value.toString());
            }
          }
        });
        formData.append('duration', taskRecordingTime.toString());
        formData.append('audioFile', taskAudioBlob, 'voice-message.webm');
        response = await fetch(`${baseUrl}/api/Chat/messages/send-task-with-voice`, {
          method: 'POST',
          body: formData
        });
      } else {
        response = await fetch(`${baseUrl}/api/Chat/messages/send-with-task`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskMessageData)
        });
      }
  
      if (response.ok) {
        const result: MessageResponse = await response.json();
        setMessages(prev => [...prev, {
          ...result,
          assignedUserIds: result.assignedUserIds || []
        } as Message]);
        closeTaskDrawer();
      } else {
        throw new Error('Failed to send task message');
      }
    } catch (error) {
      console.error('Error sending task message:', error);
      alert('Failed to send task message');
    }
  };

  const startTaskRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      taskAudioStreamRef.current = stream;
      
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      setTaskMediaRecorder(recorder);
      isRecordingCanceled.current = false;
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        if (!isRecordingCanceled.current) {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          setTaskAudioBlob(blob);
          setTaskContent(`Voice message: ${formatTime(taskRecordingTime)}`);
        }
        
        stream.getTracks().forEach(track => track.stop());
        taskAudioStreamRef.current = null;
      };
      
      recorder.start(100);
      setTaskRecording(true);
      setTaskRecordingTime(0);
      
      taskRecordingIntervalRef.current = setInterval(() => {
        setTaskRecordingTime(prev => {
          if (prev >= 59) {
            stopTaskRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone.');
    }
  };

  const stopTaskRecording = () => {
    if (taskMediaRecorder && taskMediaRecorder.state === 'recording') {
      taskMediaRecorder.stop();
    }
    setTaskRecording(false);
    if (taskRecordingIntervalRef.current) {
      clearInterval(taskRecordingIntervalRef.current);
    }
  };

  const cancelTaskRecording = () => {
    isRecordingCanceled.current = true;
    if (taskMediaRecorder) {
      taskMediaRecorder.stop();
    }
    if (taskAudioStreamRef.current) {
      taskAudioStreamRef.current.getTracks().forEach(track => track.stop());
      taskAudioStreamRef.current = null;
    }
    if (taskRecordingIntervalRef.current) clearInterval(taskRecordingIntervalRef.current);
    setTaskRecording(false);
    setTaskRecordingTime(0);
    setTaskAudioBlob(null);
    setTaskContent('');
  };

  const downloadTaskFile = async (taskId: number, messageId: number, fileName: string) => {
    try {
        const message = messages.find(m => m.id === messageId);
        if (message?.fileUrl) {
            window.open(message.fileUrl, '_blank');
            return;
        }

        const response = await fetch(`${baseUrl}/api/Chat/messages/${messageId}/file`, {
            method: 'GET'
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get download URL: ${errorText}`);
        }

        const data = await response.json();
        const downloadUrl = data.fileUrl || data.idriveUrl;

        if (downloadUrl) {
            window.open(downloadUrl, '_blank');
        } else {
            throw new Error('No download URL available');
        }
    } catch (error) {
        console.error('Error downloading task file:', error);
        alert('Failed to download file. Please try again later.');
    }
  };
  
  const playTaskVoiceMessage = async (taskId: number, messageId: number, message: Message) => {
    if (playingVoiceId === messageId) {
      pauseVoiceMessage(message);
      return;
    }
  
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
  
    try {
      let audioUrl: string;
  
      if (message.audioUrl) {
        audioUrl = message.audioUrl;
      } 
      else if (message.audioBlob) {
        console.log('Using local audioBlob');
        audioUrl = URL.createObjectURL(message.audioBlob);
      } 
      else {
        console.log(`Fetching task voice message for message ID: ${messageId}`);
        
        const response = await fetch(`${baseUrl}/api/Chat/messages/${messageId}/voice`, {
          method: 'GET'
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch task voice message: ${errorText}`);
        }
  
        const data = await response.json();
        audioUrl = data.audioUrl || data.fileUrl || data.idriveUrl;
        
        if (!audioUrl) {
          throw new Error('No audio URL available in the response');
        }
      }
  
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setPlayingVoiceId(messageId);
      
      audio.onended = () => {
        setPlayingVoiceId(null);
      };
  
      await audio.play();
    } catch (error) {
      console.error('Error in playTaskVoiceMessage:', error);
      alert('Failed to play voice message. Please try again later.');
    }
  };
  
  const VoiceMessage = ({ message }: { message: Message }) => {
    const shareVoiceMessage = () => {
      if (message.idriveUrl) {
        navigator.clipboard.writeText(message.idriveUrl);
        alert('Voice message URL copied to clipboard!');
      }
    };
  
    return (
      <div className="flex items-center space-x-3 py-2">
        <button
          onClick={() => playVoiceMessage(message)}
          className={`p-2 rounded-full transition ${
            message.senderId === currentUser?.userId
              ? 'bg-white/20 hover:bg-white/30 text-white'
              : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
          }`}
        >
          {playingVoiceId === message.id ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <div className="flex items-center space-x-2">
          <Volume2 size={16} className="opacity-70" />
          <span className="text-sm">{formatTime(message.duration || 0)}</span>
        </div>
        {message.idriveUrl && (
          <button
            onClick={shareVoiceMessage}
            className="p-1 rounded hover:bg-white/20 transition"
            title="Copy voice message URL"
          >
            <Share size={12} className="opacity-70" />
          </button>
        )}
      </div>
    );
  };

  const FileMessage = ({ message }: { message: Message }) => {
    const handleDownload = () => {
      downloadFile(message.id, message.fileName || 'file');
    };
  
    const handleOpen = () => {
      if (message.idriveUrl) {
        window.open(message.idriveUrl, '_blank');
      }
    };
  
    const shareFile = () => {
      if (message.idriveUrl) {
        navigator.clipboard.writeText(message.idriveUrl);
        alert('File URL copied to clipboard!');
      }
    };
  
    return (
      <div className={`p-3 rounded-lg border ${message.senderId === currentUser?.userId ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'} w-full`}>
        <div className="flex items-start">
          <div className="bg-blue-100 p-2 rounded-lg">
            <FileIcon className="text-blue-600" size={20} />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {message.fileName}
            </p>
            {message.fileSize && (
              <p className="text-xs text-gray-500">
                {formatFileSize(message.fileSize)}
                {message.mimeType && ` • ${message.mimeType.split('/')[1].toUpperCase()}`}
              </p>
            )}
            <div className="mt-2 flex space-x-2">
              <button
                onClick={handleDownload}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <DownloadIcon className="w-4 h-4 mr-1" />
                Download
              </button>
              {message.idriveUrl && (
                <>
                  <button
                    onClick={handleOpen}
                    className="inline-flex items-center text-sm text-green-600 hover:text-green-800"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open
                  </button>
                  <button
                    onClick={shareFile}
                    className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800"
                  >
                    <Share className="w-4 h-4 mr-1" />
                    Share
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleDownloadExcel = async (discussionId: number, discussionTitle: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/Chat/discussions/${discussionId}/tasks/export-excel`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${discussionTitle}_Tasks_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to download Excel file');
      }
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      alert('Failed to download Excel file');
    }
  };

  const closeTaskDrawer = () => {
    if (taskRecording) {
      cancelTaskRecording();
    }
    setTaskDrawerOpen(false);
    setTaskDrawerType(null);
    setTaskContent('');
    setTaskFile(null);
    setTaskAudioBlob(null);
    setTaskRecordingTime(0);
    setTaskStatus(TaskStatus.Backlog);
  };

  const closeDrawer = () => {
    if (isRecording) {
      cancelRecording();
    }
    setDrawerOpen(false);
    setDrawerType(MessageType.Text);
    setTaskContent('');
    setSelectedFile(null);
    setAudioBlob(null);
    setRecordingTime(0);
    setTaskStatus(TaskStatus.Backlog);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        {currentView !== 'users' && (
          <button onClick={goBack} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <h1 className="font-semibold text-gray-900">
          {currentView === 'users' ? 'Contacts' :
           currentView === 'discussions' ? selectedUser?.kullaniciAdi :
           selectedDiscussion?.title}
        </h1>
        <button className="p-2 -mr-2">
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className={`${currentView === 'users' ? 'flex' : 'hidden'} md:flex w-full md:w-80 bg-white flex-col border-r border-gray-200`}>
        <div className="hidden md:block p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Contacts</h2>
          <p className="text-sm text-gray-500">{users.length} contacts available</p>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search contacts..." 
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.userId}
              onClick={() => handleUserSelect(user)}
              className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.kullaniciAdi[0]}
                  </div>
                  {/* <div className="absolute -bottom-0.5 -right-0.5">
                    <StatusIndicator status={user.status} />
                  </div> */}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{user.kullaniciAdi}</div>
                  <div className="text-sm text-gray-500 truncate">{user.email}</div>
                  {/* <div className="text-xs text-gray-400 mt-0.5">{user.lastSeen}</div> */}
                </div>
                {/* {user.status === 'online' && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )} */}
              </div>
            </div>
          ))}
        </div>
      </div>

      
      <div className={`${currentView === 'discussions' ? 'flex' : 'hidden'} ${selectedUser ? 'md:flex' : 'md:hidden'} w-full md:w-80 bg-white flex-col border-r border-gray-200`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{selectedUser?.kullaniciAdi}</h3>
              <p className="text-sm text-gray-500">Discussions</p>
            </div>
            <button onClick={() => setShowCreateDiscussion(true)} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {discussions.map((discussion) => (
              <div
              key={discussion.id}
              onClick={() => handleDiscussionSelect(discussion)}
              className={`flex items-center justify-between w-full p-4 rounded-xl mb-2 cursor-pointer transition-all ${
                selectedDiscussion?.id === discussion.id
                  ? 'bg-blue-50 border-2 border-blue-200'
                  : 'hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <div>
              <div className="font-medium text-gray-900 mb-1">{discussion.title}</div>
              <div className="text-sm text-gray-500 mb-2 line-clamp-2">{discussion.description}</div>
              <div className="text-xs text-gray-400">{discussion.createdAt.toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2 ml-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/reports/${discussion.id}`);
                }}
                className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200 flex items-center justify-center"
                title="View Tasks Report"
              >
                <ListChecksIcon size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadExcel(discussion.id, discussion.title);
                }}
                className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors duration-200 flex items-center justify-center"
                title="Download Tasks Excel"
              >
                <DownloadIcon size={16} />
              </button>
            </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`${currentView === 'chat' ? 'flex' : 'hidden'} ${selectedDiscussion ? 'md:flex' : 'md:hidden'} flex-1 flex-col bg-gray-50`}>
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedUser?.kullaniciAdi?.[0]}
                </div>
                {/* <div className="absolute -bottom-0.5 -right-0.5">
                  <StatusIndicator status={selectedUser?.status || 'offline'} />
                </div> */}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{selectedDiscussion?.title}</h2>
                <div className="text-sm text-gray-500 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  {selectedUser?.kullaniciAdi}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((message) => (
            <div
                key={message.id}
                className={`flex ${
                  message.senderId === currentUser?.userId
                    ? "justify-end"
                    : "justify-start"
                }`}
              >        
              <div className={`max-w-xs sm:max-w-sm lg:max-w-md`}>
                {message.messageType === MessageType.Task ? (
                  <TaskMessage 
                  task={{
                    id: message.id,
                    title: message.taskTitle || 'Untitled Task',
                    description: message.taskDescription || message.content,
                    status: message.taskStatus as TaskStatus || TaskStatus.Backlog,
                    priority: message.taskPriority || TaskPriority.Medium,
                    dueDate: message.dueDate ? (typeof message.dueDate === 'string' ? message.dueDate : message.dueDate.toISOString()) : undefined,
                    assignedTo: message.senderName,
                    duration: message.duration,
                    taskStatus: (message.taskStatus as TaskStatus) || TaskStatus.Backlog,
                    taskPriority: message.taskPriority || TaskPriority.Medium,
                    fileName: message.fileName,
                    fileSize: message.fileSize,
                    idriveUrl: message.idriveUrl,
                    taskId: message.taskId
                  }}
                  onStatusChange={async (newStatus) => {
                    if (!currentUser) return;
                    try {
                      const response = await fetch(`${baseUrl}/api/Task/${message.taskId}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          status: newStatus,
                          updatedByUserId: currentUser.userId
                        })
                      });
                      
                      if (response.ok) {
                        const updatedMessage = await response.json();
                        setMessages(prev => prev.map(msg => 
                          msg.id === message.id ? { ...msg, ...updatedMessage } : msg
                        ));
                      }
                    } catch (error) {
                      console.error('Error updating task status:', error);
                    }
                  }}
                  onPlayVoice={message.duration ? () => playTaskVoiceMessage(message.taskId || 0, message.id, message) : undefined}
                  onDownloadFile={message.fileName ? () => downloadTaskFile(message.taskId || 0, message.id, message.fileName!) : undefined}                  isPlaying={playingVoiceId === message.id}
                />
                ) : message.messageType === MessageType.Voice ? (
                  <div className={`bg-blue-500 text-white rounded-2xl p-4`}>
                    <VoiceMessage message={message} />
                  </div>
                ): message.messageType === MessageType.File ? (
                  <div>
                    <FileMessage message={message} />
                  </div>
                ) : (
                  <div className={`rounded-2xl rounded-br-md p-4 shadow-sm ${message.senderId === currentUser?.userId ? 'bg-blue-500 text-white' : 'bg-white/90 border border-slate-200 text-slate-800'}`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                )}
                <div className={`text-xs text-gray-400 mt-1`}>
                  {message.createdAt?.toLocaleString()}
                </div>
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
              </div>
            </div>
          ))}
        </div>

        {isRecording && (
            <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-700 font-medium text-sm">Recording</span>
                  <span className="text-red-600 text-sm">
                    {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsRecording(false)}
                    className="p-1 text-red-500 hover:bg-red-100 rounded transition"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
        )}

        {audioBlob && !isRecording && (
            <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 p-4 shadow-lg backdrop-blur-sm">
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
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm disabled:opacity-50"
                  >
                    {uploading ? 'Sending...' : 'Send'}
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
            <div className="mb-4 p-3 shadow-lg backdrop-blur-sm bg-slate-50 p-3 rounded-xl border border-slate-300 min-w-64 max-w-full">
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

        {showDropdown && (
              <div className="mb-4 p-3 rounded-xl backdrop-blur-sm bg-white shadow-lg border border-slate-200 py-2 min-w-[160px] z-50">
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

        <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-end space-x-3">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading || isRecording}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
                disabled={uploading || isRecording}
              >
                <Paperclip size={20} />
              </button>
              <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-3 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
            >
              <Plus size={20} />
            </button>
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full p-3 pr-12 bg-gray-50 border-0 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                  rows={1}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={uploading || isRecording}
                />
                <button
                  onClick={sendMessage}
                  disabled={
                    (!newMessage.trim() && !selectedFile && !audioBlob) || uploading || isRecording
                  }
                  className="absolute right-2 bottom-2 p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isRecording
                    ? "bg-red-500 text-white animate-pulse shadow-lg"
                    : "bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                }`}
                disabled={uploading}
              >
                {isRecording ? <Square size={20} /> : <Mic size={20} />}
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

              <div className="bg-slate-50 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">Assigned to:</div>
                <select
                  value={selectedUser?.userId || ''}
                  onChange={(e) => {
                    const userId = parseInt(e.target.value);
                    const user = users.find(u => u.userId === userId);
                    setSelectedUser(user || null);
                  }}
                  className="text-sm border border-slate-300 rounded px-2 py-1 bg-white min-w-[150px]"
                >
                  <option value="">No assignee</option>
                  {users.map(user => (
                    <option key={user.userId} value={user.userId}>
                      {user.kullaniciAdi}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <div className="text-sm text-slate-600 mb-2">Clients:</div>
                <div className="space-y-2">
                  {selectedClients.map(client => (
                    <div key={client.id} className="flex items-center justify-between bg-white px-2 py-1 rounded border">
                      <span className="text-sm">{client.first_name}</span>
                      <button
                        onClick={() => setSelectedClients(prev => prev.filter(c => c.id !== client.id))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <select
                    value=""
                    onChange={(e) => {
                      const clientId = parseInt(e.target.value);
                      const client = clients.find(c => c.id === clientId);
                      if (client && !selectedClients.find(c => c.id === clientId)) {
                        setSelectedClients(prev => [...prev, client]);
                      }
                    }}
                    className="w-full text-sm border border-slate-300 rounded px-2 py-1 bg-white"
                  >
                    <option value="">Add client...</option>
                    {clients.filter(client => !selectedClients.find(c => c.id === client.id)).map(client => (
                      <option key={client.id} value={client.id}>
                        {client.first_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-slate-600 mb-2">Projects:</div>
                <div className="space-y-2">
                  {selectedProjects.map(project => (
                    <div key={project.id} className="flex items-center justify-between bg-white px-2 py-1 rounded border">
                      <span className="text-sm">{project.title}</span>
                      <button
                        onClick={() => setSelectedProjects(prev => prev.filter(p => p.id !== project.id))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <select
                    value=""
                    onChange={(e) => {
                      const projectId = parseInt(e.target.value);
                      const project = projects.find(p => p.id === projectId);
                      if (project && !selectedProjects.find(p => p.id === projectId)) {
                        setSelectedProjects(prev => [...prev, project]);
                      }
                    }}
                    className="w-full text-sm border border-slate-300 rounded px-2 py-1 bg-white"
                  >
                    <option value="">Add project...</option>
                    {projects.filter(project => !selectedProjects.find(p => p.id === project.id)).map(project => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </div>
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
                    {taskFile ? (
                      <div className="flex items-center justify-center space-x-2">
                        <FileText size={20} className="text-green-600" />
                        <span className="font-medium">{taskFile.name}</span>
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
                    onChange={handleTaskFileChange}
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
                    {!taskAudioBlob ? (
                      <div className="text-center">
                        {taskRecording ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center justify-center space-x-3 mb-3">
                              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="text-red-600 font-medium">
                                Recording: {formatTime(taskRecordingTime)}
                              </span>
                            </div>
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={stopTaskRecording}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center space-x-2"
                              >
                                <Square size={16} />
                                <span>Stop</span>
                              </button>
                              <button
                                onClick={cancelTaskRecording}
                                className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={startTaskRecording}
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
                          <span className="font-medium">Recording ready: {formatTime(taskRecordingTime)}</span>
                          <button
                            onClick={() => {
                              setTaskAudioBlob(null);
                              setTaskRecordingTime(0);
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
                  onClick={() => handleSendTask(taskContent, taskFile, taskAudioBlob, taskRecordingTime, drawerType, taskStatus, selectedDiscussion, currentUser, selectedUser, setMessages, closeDrawer, baseUrl, selectedClients.map(c => c.id), selectedProjects.map(p => p.id),)}
                  disabled={!taskContent.trim() && !taskFile && !taskAudioBlob}
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