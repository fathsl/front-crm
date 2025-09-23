import { useAtomValue } from "jotai";
import { AlertCircle, ArrowLeft, CheckCircle, Clock, DownloadIcon, Edit3, ExternalLink, EyeIcon, FileIcon, FileText, Hourglass, ListChecksIcon, MessageSquare, Mic, MoreVertical, Paperclip, Pause, Play, Plus, Search, Send, Share, Square, Trash2, Users, UsersIcon, Volume2, X, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react"; 
import { formatFileSize, type SendMessageRequest, type User } from "~/help";
import { DiscussionStatus, type Client, type CreateDiscussionRequest, type Project } from "~/help";
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

enum MessageType {
  Text = 1,
  File = 2,
  Task = 3,
  Voice = 4,
}

interface DiscussionWithLastTask extends Discussion {
  lastTaskStatus?: TaskStatusBg;
  senderName?: string;
  receiverName?: string;
  status?: DiscussionStatus;
}

interface AssignedUser {
  assignedUserId: number;
  assignedUserName: string;
  assignedByUserId: number;
  assignedByUserName: string;
  assignedAt: string;
}

interface AssignDiscussionRequest {
  discussionId: number;
  userIds: number[];
  assignedByUserId: number;
}

interface AssignmentResponse {
  message: string;
  assignedUsers: number[];
  alreadyAssigned: number[];
  totalAssigned: number;
  totalSkipped: number;
}

enum TaskStatusBg {
  Backlog = 0,
  ToDo = 1,
  InProgress = 2,
  InReview = 3,
  Done = 4
}

export interface UpdateDiscussionStatusRequest {
  status: number;
  updatedByUserId: number;
}

const ChatApplication: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [discussions, setDiscussions] = useState<DiscussionWithLastTask[]>([]);
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
  const [selectedClients, setSelectedClients] = useState<Client[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  const [isCreatingDiscussion, setIsCreatingDiscussion] = useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [newDiscussionStatus, setNewDiscussionStatus] = useState<DiscussionStatus>(DiscussionStatus.NotStarted);
  const [updatingDiscussions, setUpdatingDiscussions] = useState<Set<number>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);
  const [showUsersDrawer, setShowUsersDrawer] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<number | null>(null);
  const [assignedUsers, setAssignedUsers] = useState<{ [discussionId: number]: AssignedUser[] }>({});
  const [loadingAssignedUsers, setLoadingAssignedUsers] = useState<{ [discussionId: number]: boolean }>({});

  const [searchTerm, setSearchTerm] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const taskAudioStreamRef = useRef<MediaStream | null>(null);
  const taskRecordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [taskMediaRecorder, setTaskMediaRecorder] = useState<MediaRecorder | null>(null);
  const isRecordingCanceled = useRef(false);
  const navigate = useNavigate();
  const baseUrl = "https://api-crm-tegd.onrender.com";
  const isAdmin = currentUser?.role === "Yonetici";

  const sortByCreatedAtAsc = (arr: Message[]) => {
    const toTime = (m: any) => {
      const base = m?.createdAt ?? m?.timestamp;
      const t = base ? new Date(base).getTime() : undefined;
      if (!isNaN(Number(t))) return Number(t);
      return typeof m?.id === 'number' ? m.id : 0;
    };
    return arr.slice().sort((a, b) => toTime(a) - toTime(b));
  };

  const getPriorityFromNumber = (priorityNum: number): TaskPriority => {
    const priorityMap = {
      0: TaskPriority.Low,
      1: TaskPriority.Medium,
      2: TaskPriority.High
    };
    return priorityMap[priorityNum as keyof typeof priorityMap] || TaskPriority.Medium;
  };

  const getStatusBackgroundColor = (status?: TaskStatusBg, isSelected?: boolean) => {
    if (isSelected) {
      switch (status) {
        case TaskStatusBg.Backlog:
          return 'bg-gray-100 border-2 border-gray-300';
        case TaskStatusBg.ToDo:
          return 'bg-yellow-100 border-2 border-yellow-300';
        case TaskStatusBg.InProgress:
          return 'bg-blue-100 border-2 border-blue-300';
        case TaskStatusBg.InReview:
          return 'bg-violet-100 border-2 border-violet-300';
        case TaskStatusBg.Done:
          return 'bg-green-100 border-2 border-green-300';
        default:
          return 'bg-gray-50 border-2 border-gray-200';
      }
    }

    switch (status) {
      case TaskStatusBg.Backlog:
        return 'bg-gray-50 hover:bg-gray-100';
      case TaskStatusBg.ToDo:
        return 'bg-yellow-50 hover:bg-yellow-100';
      case TaskStatusBg.InProgress:
        return 'bg-blue-50 hover:bg-blue-100';
      case TaskStatusBg.InReview:
        return 'bg-violet-50 hover:bg-violet-100';
      case TaskStatusBg.Done:
        return 'bg-green-50 hover:bg-green-100';
      default:
        return 'hover:bg-gray-50 active:bg-gray-100';
    }
  };

  const getTaskStatusText = (status: TaskStatusBg): string => {
    switch (status) {
      case TaskStatusBg.Backlog:
        return 'Backlog';
      case TaskStatusBg.ToDo:
        return 'To Do';
      case TaskStatusBg.InProgress:
        return 'In Progress';
      case TaskStatusBg.InReview:
        return 'In Review';
      case TaskStatusBg.Done:
        return 'Done';
      default:
        return 'Unknown';
    }
  };

  const getDiscussionStatusText = (status: DiscussionStatus): string => {
    switch (status) {
      case DiscussionStatus.NotStarted:
        return 'Not Started';
      case DiscussionStatus.InProgress:
        return 'In Progress';
      case DiscussionStatus.Completed:
        return 'Completed';
      default:
        return 'Not Started';
    }
  };

  const getDiscussionStatusColor = (status: DiscussionStatus): string => {
    switch (status) {
      case DiscussionStatus.NotStarted:
        return 'bg-gray-500';
      case DiscussionStatus.InProgress:
        return 'bg-blue-500';
      case DiscussionStatus.Completed:
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getNextStatus = (currentStatus: number): number => {
    switch (currentStatus) {
      case 0:
        return 1;
      case 1:
        return 2;
      case 2:
        return 0;
      default:
        return 0;
    }
  };

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
  
  const fetchProjects = async () => {
        try {
          const response = await fetch(`${baseUrl}/api/Project`);
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

  const fetchAssignedUsers = useCallback(async (discussionId: number) => {
    if (loadingAssignedUsers[discussionId]) return;
   
    setLoadingAssignedUsers(prev => ({ ...prev, [discussionId]: true }));
   
    try {
      const response = await fetch(`${baseUrl}/api/Chat/discussions/${discussionId}/assigned-users`);
      if (response.ok) {
        const data: AssignedUser[] = await response.json();
        setAssignedUsers(prev => ({ ...prev, [discussionId]: data }));
        
        const assignedUserIds = new Set(data.map(user => user.assignedUserId));
        setSelectedUsers(assignedUserIds);
        
        return data;
      } else {
        throw new Error('Failed to fetch assigned users');
      }
    } catch (error) {
      console.error('Error fetching assigned users:', error);
      return [];
    } finally {
      setLoadingAssignedUsers(prev => ({ ...prev, [discussionId]: false }));
    }
  }, [loadingAssignedUsers]);

  const fetchDiscussions = useCallback(async (currentUserId: number, selectedUserId?: number) => {
    if (!currentUserId) return;

    setLoading(true);
    try {
        let url = `${baseUrl}/api/Chat/discussions/${currentUserId}`;

        if (selectedUserId !== undefined) {
            if (isAdmin) {
                url = `${baseUrl}/api/Chat/discussions/admin/${currentUserId}/${selectedUserId}`;
            } else {
                url = `${baseUrl}/api/Chat/discussions/${currentUserId}/${selectedUserId}`;
            }
        }

        const response = await fetch(url);
        if (response.ok) {
            const data: Discussion[] = await response.json();

            const uniqueDiscussions = data.filter((discussion: Discussion, index: number, self: Discussion[]) =>
                index === self.findIndex((d: Discussion) => d.id === discussion.id)
            );

            setDiscussions(uniqueDiscussions);

            uniqueDiscussions.forEach((discussion: Discussion) => {
                fetchAssignedUsers(discussion.id);
            });
        } else {
            throw new Error('Failed to fetch discussions');
        }
      } catch (error) {
          console.error('Error fetching discussions:', error);
      } finally {
          setLoading(false);
      }
  }, [isAdmin, fetchAssignedUsers]);

  const fetchMessages = useCallback(async (discussionId: number) => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`${baseUrl}/api/Chat/discussions/${discussionId}/messages?userId=${currentUser.userId}`);
      if (response.ok) {
        const data = await response.json();
        const sorted = sortByCreatedAtAsc(data as Message[]);
        setMessages(sorted as Message[]);
      } else {
        console.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [currentUser]);

  const createDiscussion = async () => {
    if (!selectedUser || !newDiscussionTitle.trim() || isCreatingDiscussion) return;

    setIsCreatingDiscussion(true);

    const request: CreateDiscussionRequest = {
      title: newDiscussionTitle,
      description: newDiscussionDescription,
      createdByUserId: currentUser?.userId || 0,
      participantUserIds: [currentUser?.userId || 0, selectedUser.userId],
      senderId: currentUser?.userId || 0,
      receiverId: selectedUser.userId,
      status: newDiscussionStatus
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
      } else {
        throw new Error('Failed to create discussion');
      }
    } catch (error) {
      console.error('Error creating discussion:', error);
    } finally {
      setIsCreatingDiscussion(false);
    }
  };

  const handleStatusUpdate = async (discussionId: number, currentStatus: number, e: React.MouseEvent) => {
    e.stopPropagation();
  
    if (updatingDiscussions.has(discussionId)) {
      return;
    }
  
    const nextStatus = getNextStatus(currentStatus);
    
    setUpdatingDiscussions(prev => new Set([...prev, discussionId]));
  
    const request: UpdateDiscussionStatusRequest = {
      status: nextStatus,
      updatedByUserId: currentUser?.userId || 0
    };
  
    try {
      const response = await fetch(`${baseUrl}/api/Chat/discussions/${discussionId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
  
      if (response.ok) {
        setDiscussions(prev => 
          prev.map(discussion => 
            discussion.id === discussionId 
              ? { ...discussion, status: nextStatus }
              : discussion
          )
        );
  
        if (selectedDiscussion?.id === discussionId) {
          setSelectedDiscussion(prev => 
            prev ? { ...prev, status: nextStatus } : prev
          );
        }
  
        console.log(`Discussion ${discussionId} status updated to ${nextStatus}`);
      } else {
        console.error('Failed to update discussion status');
      }
    } catch (error) {
      console.error('Error updating discussion status:', error);
    } finally {
      setUpdatingDiscussions(prev => {
        const newSet = new Set(prev);
        newSet.delete(discussionId);
        return newSet;
      });
    }
  };

  const assignUsersToDiscussion = async (discussionId: number, userIds: number[]) => {
    if (!currentUser || userIds.length === 0) return;
  
    setIsAssigning(true);
    try {
      const request: AssignDiscussionRequest = {
        discussionId,
        userIds,
        assignedByUserId: currentUser.userId
      };

      const response = await fetch(`${baseUrl}/api/Chat/discussions/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (response.ok) {
        const result: AssignmentResponse = await response.json();
        
        if (result.totalAssigned > 0) {
          console.log(`Successfully assigned ${result.totalAssigned} users to the discussion`);
        }
        
        if (result.totalSkipped > 0) {
          console.log(`${result.totalSkipped} users were already assigned to this discussion`);
        }

        setSelectedUsers(new Set());
        handleCloseUsersDrawer();
        
        await fetchDiscussions(currentUser.userId, selectedUser?.userId);
        
      } else if (response.status === 403) {
        console.error('You don\'t have permission to assign users to this discussion');
      } else {
        throw new Error('Failed to assign users to discussion');
      }
    } catch (error) {
      console.error('Error assigning users to discussion:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignClick = () => {
    if (selectedDiscussionId && selectedUsers.size > 0) {
      assignUsersToDiscussion(selectedDiscussionId, Array.from(selectedUsers));
    }
  };
  
  const filteredClients = clients.filter(client =>
    `${client.first_name} ${client.last_name}`.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(clientSearchTerm.toLowerCase()))
  );

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
    (project.details && project.details.toLowerCase().includes(projectSearchTerm.toLowerCase()))
  );
  
  const handleCloseUsersDrawer = () => {
    setShowUsersDrawer(false);
    setSelectedDiscussionId(null);
    setSearchTerm('');
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
       
        setMessages(prev => sortByCreatedAtAsc([...(prev as Message[]), message as Message]));
       
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
      messageType: 1
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
        setMessages(prev => sortByCreatedAtAsc(
          (prev as Message[]).map(msg => (msg.id === messageId ? (updatedMessage as Message) : msg))
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

  const markDiscussionMessagesAsSeen = async (discussionId: number, userId: number) => {
    try {
      const response = await fetch(`${baseUrl}/api/Chat/discussions/${discussionId}/mark-all-seen?userId=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
 
      if (!response.ok) {
        throw new Error(`Failed to mark discussion messages as seen: ${response.statusText}`);
      }
 
      return await response.json();
    } catch (error) {
      console.error('Error marking discussion messages as seen:', error);
      throw error;
    }
  };

  const getUnreadMessageCount = async (discussionId: number, userId: number) => {
    try {
      const response = await fetch(`${baseUrl}/api/Chat/discussions/${discussionId}/unreadcount?userId=${userId}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
  
      if (!response.ok) {
        throw new Error(`Failed to get unread count: ${response.statusText}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error getting unread message count:', error);
      throw error;
    }
  };

  const updateUnreadCount = async (discussionId: number) => {
    try {
      const currentUserId = currentUser?.userId || 0;
      const unreadCount = await getUnreadMessageCount(discussionId, currentUserId);
      
      setDiscussions(prevDiscussions => 
        prevDiscussions.map(disc => 
          disc.id === discussionId 
            ? { ...disc, unreadCount: unreadCount }
            : disc
        )
      );
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setSelectedDiscussion(null);
    setMessages([]);
    
    fetchDiscussions(currentUser?.userId || 0, user.userId);
    
    setCurrentView('discussions');
  };

  const handleDiscussionSelect = async (discussion: Discussion) => {
    setSelectedDiscussion(discussion);
    setCurrentView('chat');
 
    try {
      await fetchMessages(discussion.id);
     
      if (currentUser?.userId) {
        await markDiscussionMessagesAsSeen(discussion.id, currentUser.userId);
       
        setMessages(prev =>
          prev.map(msg => {
            if (msg.receiverId === currentUser.userId && !msg.isSeen) {
              return {
                ...msg,
                isSeen: true,
                seenAt: new Date()
              };
            }
            return msg;
          })
        );
      }
 
      updateUnreadCount(discussion.id);
    } catch (error) {
      console.error('Error in handleDiscussionSelect:', error);
    }
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
       
      setMessages(prev => sortByCreatedAtAsc([...(prev as Message[]), newVoiceMessage]));
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

  const filteredUsers = users.filter(user =>
    user.kullaniciAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const statusOptions = [
    { value: TaskStatus.Backlog, label: 'Backlog', icon: Clock, color: 'text-gray-600 bg-gray-50' },
    { value: TaskStatus.ToDo, label: 'Todo', icon: AlertCircle, color: 'text-yellow-600 bg-yellow-100' },
    { value: TaskStatus.InProgress, label: 'In Progress', icon: Hourglass, color: 'text-blue-600 bg-blue-100' },
    { value: TaskStatus.InReview, label: 'In Review', icon: EyeIcon, color: 'text-violet-600 bg-violet-100' },
    { value: TaskStatus.Done, label: 'Done', icon: CheckCircle, color: 'text-green-600 bg-green-100' }
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
        setMessages(prev => sortByCreatedAtAsc([...(prev as Message[]), {
          ...result,
          assignedUserIds: result.assignedUserIds || []
        } as Message]));

        if (selectedDiscussion) {
          setDiscussions(prev => prev.map(disc => 
            disc.id === selectedDiscussion.id 
              ? { ...disc, lastTaskStatus: Number(taskStatus) as unknown as TaskStatusBg }
              : disc
          ));
        }

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

  useEffect(() => {
    if (messagesContainerRef.current) {
      const el = messagesContainerRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, selectedDiscussion]);

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
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                {isAdmin ? 'All Users' : 'Select User to Chat'}
              </h2>
              <p className="text-sm text-gray-500">
                {isAdmin ? 'View any user\'s discussions' : 'Start or continue conversations'}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredUsers.map((user) => (
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
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{user.kullaniciAdi}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
                {isAdmin && (
                  <div className="text-xs text-blue-600 mt-1">
                    {user.role}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className={`${currentView === 'discussions' ? 'flex' : 'hidden'} ${selectedUser ? 'md:flex' : 'md:hidden'} w-full md:w-80 bg-white flex-col border-r border-gray-200`}>
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              {isAdmin 
                ? `${selectedUser?.kullaniciAdi}'s Discussions` 
                : `Chat with ${selectedUser?.kullaniciAdi}`
              }
            </h3>
            <p className="text-sm text-gray-500">
              {isAdmin 
                ? 'All discussions involving this user' 
                : 'Your conversations together'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentView('users')}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            {selectedUser && (
              <button 
                onClick={() => setShowCreateDiscussion(true)} 
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {discussions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="text-sm">
              {isAdmin
                ? 'No discussions found for this user'
                : 'No conversations yet. Start a new discussion!'
              }
            </div>
          </div>
        ) : (
          discussions.map((discussion) => {
            const isSelected = selectedDiscussion?.id === discussion.id;
            const handleOpenUsersDrawer = async () => {
              setSelectedDiscussionId(discussion.id);
              setShowUsersDrawer(true);
              
              await fetchAssignedUsers(discussion.id);
            };
          
            const handleCloseUsersDrawer = () => {
              setShowUsersDrawer(false);
              setSelectedDiscussionId(null);
              setSearchTerm('');
            };
          
            const handleUserToggle = (userId: number) => {
              setSelectedUsers(prev => {
                const newSet = new Set(prev);
                if (newSet.has(userId)) {
                  newSet.delete(userId);
                } else {
                  newSet.add(userId);
                }
                return newSet;
              });
            };
          
            return (
              <div
                key={discussion.id}
                onClick={() => handleDiscussionSelect(discussion)}
                className={`group relative w-full bg-white rounded-2xl shadow-sm hover:shadow-lg border transition-all duration-300 cursor-pointer overflow-hidden mb-4 ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 shadow-lg border-blue-200' 
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div 
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    getStatusBackgroundColor(discussion.lastTaskStatus, false)
                  }`}
                />
                
                <div className="p-4 sm:p-5 lg:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors break-words">
                        {discussion.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 line-clamp-2 sm:line-clamp-3 mb-3 leading-relaxed break-words">
                        {discussion.description}
                      </p>
                    </div>
                  </div>
          
                  <div className="bg-gray-50 rounded-xl p-3 mb-4">
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex items-center text-gray-700 min-w-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0"></div>
                        <span className="font-medium flex-shrink-0">From:</span>
                        <span className="ml-1 text-gray-900 truncate">{discussion.senderName}</span>
                      </div>
                      <div className="flex items-center text-gray-700 min-w-0">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0"></div>
                        <span className="font-medium flex-shrink-0">To:</span>
                        <span className="ml-1 text-gray-900 truncate">{discussion.receiverName}</span>
                      </div>
                    </div>
                  </div>
          
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span 
                      onClick={(e) => handleStatusUpdate(discussion.id, discussion.status || DiscussionStatus.NotStarted, e)}
                      className={`inline-flex items-center px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                        updatingDiscussions.has(discussion.id) 
                          ? 'opacity-50 cursor-wait bg-gray-100 text-gray-600' 
                          : `text-white ${getDiscussionStatusColor(discussion.status || DiscussionStatus.NotStarted)} hover:opacity-90 shadow-sm`
                      }`}
                      title={`Click to change status (Current: ${getDiscussionStatusText(discussion.status || DiscussionStatus.NotStarted)})`}
                    >
                      {updatingDiscussions.has(discussion.id) ? (
                        <>
                          <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-1.5 flex-shrink-0"></div>
                          <span className="hidden sm:inline">Updating...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-white bg-opacity-70 rounded-full mr-1.5 flex-shrink-0"></div>
                          <span className="truncate">{getDiscussionStatusText(discussion.status || DiscussionStatus.NotStarted)}</span>
                        </>
                      )}
                    </span>
          
                    {discussion.lastTaskStatus !== undefined && discussion.lastTaskStatus !== null && (
                      <span className={`inline-flex items-center px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium text-white shadow-sm ${
                        discussion.lastTaskStatus === TaskStatusBg.Backlog ? 'bg-slate-500' :
                        discussion.lastTaskStatus === TaskStatusBg.ToDo ? 'bg-amber-500' :
                        discussion.lastTaskStatus === TaskStatusBg.InProgress ? 'bg-blue-500' :
                        discussion.lastTaskStatus === TaskStatusBg.InReview ? 'bg-purple-500' :
                        discussion.lastTaskStatus === TaskStatusBg.Done ? 'bg-emerald-500' : 'bg-gray-500'
                      }`}>
                        <div className="w-2 h-2 bg-white bg-opacity-70 rounded-full mr-1.5 flex-shrink-0"></div>
                        <span className="truncate">Task: {getTaskStatusText(discussion.lastTaskStatus)}</span>
                      </span>
                    )}
                  </div>
          
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center text-xs text-gray-500">
                      <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="truncate">{new Date(discussion.createdAt).toLocaleString()}</span>
                    </div>
          
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/reports/${discussion.id}`);
                        }}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm min-h-[44px]"
                        title="View Tasks Report"
                      >
                        <ListChecksIcon size={12} className="mr-1 flex-shrink-0" />
                        <span className="text-xs">Reports</span>
                      </button>
          
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadExcel(discussion.id, discussion.title);
                        }}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center px-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm min-h-[44px]"
                        title="Download Tasks Excel"
                      >
                        <DownloadIcon size={12} className="mr-1 flex-shrink-0" />
                        <span className="text-xs">Download</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenUsersDrawer();
                        }}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center px-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm min-h-[44px]"
                        title="Manage Users"
                      >
                        <UsersIcon size={12} className="mr-1 flex-shrink-0" />
                        <span className="text-xs">Users</span>
                      </button>
                    </div>
                  </div>
                </div>
          
                {showUsersDrawer && selectedDiscussionId === discussion.id && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
                    onClick={handleCloseUsersDrawer}
                  />
                  
                  <div className={`fixed inset-0 sm:top-0 sm:right-0 sm:left-auto sm:inset-auto sm:h-screen w-full sm:w-80 md:w-96 lg:w-[28rem] bg-white shadow-2xl z-50 transform transition-all duration-300 ease-out flex flex-col ${
                    showUsersDrawer ? 'translate-x-0' : 'translate-x-full'
                  }`}>
                    <div className="flex-shrink-0 flex items-start sm:items-center justify-between p-4 sm:p-6 border-b bg-gradient-to-r from-purple-500 to-purple-600 text-white min-h-[80px] sm:min-h-0">
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-lg font-semibold mb-1">Manage Users</h3>
                        <p className="text-purple-100 text-sm break-words line-clamp-2">{discussion.title}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 flex-shrink-0">
                        <button
                          onClick={handleAssignClick}
                          disabled={selectedUsers.size === 0 || isAssigning}
                          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap ${
                            selectedUsers.size === 0 || isAssigning
                              ? 'bg-white/10 text-white/50 cursor-not-allowed'
                              : 'bg-white/20 hover:bg-white/30 text-white'
                          }`}
                        >
                          {isAssigning ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span className="hidden sm:inline">Assigning...</span>
                              <span className="sm:hidden">...</span>
                            </div>
                          ) : (
                            `Assign (${selectedUsers.size})`
                          )}
                        </button>
                        <button 
                          onClick={handleCloseUsersDrawer} 
                          className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
          
                    <div className="flex-shrink-0 p-4 bg-gray-50 border-b">
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
                          autoFocus
                        />
                      </div>
                    </div>
          
                    {selectedUsers.size > 0 && (
                      <div className="flex-shrink-0 px-4 py-2 bg-purple-50 border-b border-purple-100">
                        <p className="text-sm text-purple-700">
                          <span className="font-medium">{selectedUsers.size}</span> user{selectedUsers.size !== 1 ? 's' : ''} selected
                        </p>
                      </div>
                    )}
          
                <div className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0">
                  {filteredUsers.map((user) => {
                    const isSelected = selectedUsers.has(user.userId);
                    const isAlreadyAssigned = assignedUsers[selectedDiscussionId || 0]?.some(
                      assignedUser => assignedUser.assignedUserId === user.userId
                    ) || false;
                    const isNewlySelected = isSelected && !isAlreadyAssigned;

                    return (
                      <label 
                        key={user.userId} 
                        className={`flex items-center p-3 rounded-xl cursor-pointer transition-colors group border-2 ${
                          isAlreadyAssigned 
                            ? 'bg-green-50 hover:bg-green-100 border-green-200' 
                            : isNewlySelected
                            ? 'bg-blue-50 hover:bg-blue-100 border-blue-200'
                            : 'hover:bg-gray-50 border-transparent hover:border-gray-200'
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleUserToggle(user.userId)}
                            className={`w-5 h-5 bg-white border-2 rounded focus:ring-2 transition-colors ${
                              isAlreadyAssigned
                                ? 'text-green-600 border-green-300 focus:ring-green-500'
                                : 'text-purple-600 border-gray-300 focus:ring-purple-500'
                            }`}
                          />
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg className="w-3 h-3 text-white pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium transition-colors truncate ${
                              isAlreadyAssigned
                                ? 'text-green-900 group-hover:text-green-700'
                                : isNewlySelected
                                ? 'text-blue-900 group-hover:text-blue-700'
                                : 'text-gray-900 group-hover:text-purple-600'
                            }`}>
                              {user.kullaniciAdi}
                            </span>
                            
                            <div className="flex items-center gap-2 ml-2">
                              {isAlreadyAssigned && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                                  Assigned
                                </span>
                              )}
                              {isNewlySelected && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1"></div>
                                  New
                                </span>
                              )}
                              {isSelected && (
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  isAlreadyAssigned ? 'bg-green-500' : 'bg-blue-500'
                                }`}></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                  
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm font-medium mb-1">No users found</p>
                      <p className="text-gray-400 text-xs">Try adjusting your search terms</p>
                    </div>
                  )}
                </div>
                    
                    <div className="flex-shrink-0 p-4 border-t bg-gray-50">
                      <div className="flex items-center justify-between text-xs text-gray-500 gap-4">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              filteredUsers.forEach(user => {
                                setSelectedUsers(prev => new Set(prev.add(user.userId)));
                              });
                            }}
                            className="text-purple-600 hover:text-purple-700 font-medium whitespace-nowrap"
                          >
                            Select All
                          </button>
                          <span className="text-gray-300">•</span>
                          <button
                            onClick={() => setSelectedUsers(new Set())}
                            className="text-gray-600 hover:text-gray-700 font-medium whitespace-nowrap"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              </div>
            );
          })
        )}
      </div>
    </div>

      <div className={`${currentView === 'chat' ? 'flex' : 'hidden'} ${selectedDiscussion ? 'md:flex' : 'md:hidden'} flex-1 flex-col bg-gray-50`}>
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedUser?.kullaniciAdi[0]}
                </div>
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

        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
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
                {message.messageType === 3 ? (
                  <TaskMessage 
                  task={{
                    id: message.id,
                    title: message.taskTitle || 'Untitled Task',
                    description: message.taskDescription || message.content,
                    status: message.taskStatus as TaskStatus || TaskStatus.Backlog,
                    priority: typeof message.taskPriority === 'number' 
                    ? getPriorityFromNumber(message.taskPriority)
                    : (message.taskPriority as TaskPriority) || TaskPriority.Medium,
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
                ) : message.messageType === 4 ? (
                  <div className={`bg-blue-500 text-white rounded-2xl p-4`}>
                    <VoiceMessage message={message} />
                  </div>
                ): message.messageType === 2 ? (
                  <div>
                    <FileMessage message={message} />
                  </div>
                ) : (
                  <div className={`rounded-2xl rounded-br-md p-4 shadow-sm ${message.senderId === currentUser?.userId ? 'bg-blue-500 text-white' : 'bg-white/90 border border-slate-200 text-slate-800'}`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                )}
                <div className={`text-xs text-gray-400 mt-1`}>
                  {(() => {
                    const raw = (message as any).createdAt ?? (message as any).timestamp;
                    try { return raw ? new Date(raw).toLocaleString() : ''; } catch { return ''; }
                  })()}
                </div>
                {message.senderId === currentUser?.userId && (message.messageType === 1 || message.messageType === 4) && (
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
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              <Users size={40} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Welcome to Chat</h3>
              <p className="text-slate-500">Select a contact to start messaging</p>
            </div>
          </div>
        </div>
      )}

      {selectedUser && !selectedDiscussion && (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discussion Status
              </label>
              <select
                value={newDiscussionStatus}
                onChange={(e) => setNewDiscussionStatus(Number(e.target.value) as DiscussionStatus)}
                className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value={DiscussionStatus.NotStarted}>Not Started</option>
                <option value={DiscussionStatus.InProgress}>In Progress</option>
                <option value={DiscussionStatus.Completed}>Completed</option>
              </select>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button
              onClick={createDiscussion}
              disabled={!newDiscussionTitle.trim() || isCreatingDiscussion}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                isCreatingDiscussion || !newDiscussionTitle.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isCreatingDiscussion ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                'Create Discussion'
              )}
            </button>
            <button
              onClick={() => {
                setShowCreateDiscussion(false);
                setNewDiscussionStatus(DiscussionStatus.NotStarted);
              }}
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

              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-700">Clients:</div>
                  
                  <div className="relative">
                    <div
                      onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                      className="min-h-[42px] w-full border border-slate-300 rounded-lg px-3 py-2 bg-white cursor-pointer hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 flex items-center justify-between"
                    >
                      <div className="flex-1 flex flex-wrap gap-2">
                        {selectedClients.length === 0 ? (
                          <span className="text-slate-500 text-sm">Select clients...</span>
                        ) : (
                          selectedClients.map(client => (
                            <span
                              key={client.id}
                              className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                            >
                              {client.first_name} {client.last_name}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedClients(prev => prev.filter(c => c.id !== client.id));
                                }}
                                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                      <svg
                        className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
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
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
                        <div className="p-3">
                          <div className="relative mb-3">
                            <input
                              type="text"
                              placeholder="Search clients..."
                              value={clientSearchTerm}
                              onChange={(e) => setClientSearchTerm(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                              autoFocus
                            />
                            <svg
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {clientSearchTerm && (
                              <button
                                onClick={() => setClientSearchTerm('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                            <span className="text-sm font-medium text-slate-700">Select Clients</span>
                            <div className="flex gap-2">
                              {filteredClients.length > 0 && (
                                <button
                                  onClick={() => {
                                    const newClients = filteredClients.filter(client =>
                                      !selectedClients.some(selected => selected.id === client.id)
                                    );
                                    setSelectedClients(prev => [...prev, ...newClients]);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 hover:bg-blue-50 rounded font-medium"
                                >
                                  Select All
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedClients([])}
                                className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 hover:bg-slate-100 rounded"
                              >
                                Clear All
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="max-h-40 overflow-y-auto px-3 pb-3">
                          {filteredClients.map(client => {
                            const isSelected = selectedClients.some(c => c.id === client.id);
                            return (
                              <div
                                key={client.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedClients(prev => prev.filter(c => c.id !== client.id));
                                  } else {
                                    setSelectedClients(prev => [...prev, client]);
                                  }
                                }}
                                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-blue-50 text-blue-900'
                                    : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'border-slate-300'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-1">
                                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                    {client.first_name.charAt(0).toUpperCase()}{client.last_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{client.first_name} {client.last_name}</div>
                                    {client.email && (
                                      <div className="text-xs text-slate-500 truncate">{client.email}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          {filteredClients.length === 0 && clientSearchTerm && (
                            <div className="text-center text-slate-500 text-sm py-4">
                              <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              No clients found for "{clientSearchTerm}"
                            </div>
                          )}
                          
                          {clients.length === 0 && (
                            <div className="text-center text-slate-500 text-sm py-4">
                              <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              No clients available
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selectedClients.length > 0 && (
                    <div className="flex items-center justify-between text-xs text-slate-600 bg-white px-3 py-2 rounded border">
                      <span>{selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''} selected</span>
                      <button
                        onClick={() => setSelectedClients([])}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
      
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-700">Projects:</div>
                  
                  <div className="relative">
                    <div
                      onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                      className="min-h-[42px] w-full border border-slate-300 rounded-lg px-3 py-2 bg-white cursor-pointer hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 flex items-center justify-between"
                    >
                      <div className="flex-1 flex flex-wrap gap-2">
                        {selectedProjects.length === 0 ? (
                          <span className="text-slate-500 text-sm">Select projects...</span>
                        ) : (
                          selectedProjects.map(project => (
                            <span
                              key={project.id}
                              className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                            >
                              {project.title}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProjects(prev => prev.filter(p => p.id !== project.id));
                                }}
                                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                      <svg
                        className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                          isProjectDropdownOpen ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    
                    {isProjectDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
                        <div className="p-3">
                          <div className="relative mb-3">
                            <input
                              type="text"
                              placeholder="Search projects..."
                              value={projectSearchTerm}
                              onChange={(e) => setProjectSearchTerm(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                              autoFocus
                            />
                            <svg
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {projectSearchTerm && (
                              <button
                                onClick={() => setProjectSearchTerm('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                            <span className="text-sm font-medium text-slate-700">Select Projects</span>
                            <div className="flex gap-2">
                              {filteredProjects.length > 0 && (
                                <button
                                  onClick={() => {
                                    const newProjects = filteredProjects.filter(project =>
                                      !selectedProjects.some(selected => selected.id === project.id)
                                    );
                                    setSelectedProjects(prev => [...prev, ...newProjects]);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 hover:bg-blue-50 rounded font-medium"
                                >
                                  Select All
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedProjects([])}
                                className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 hover:bg-slate-100 rounded"
                              >
                                Clear All
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="max-h-40 overflow-y-auto px-3 pb-3">
                          {filteredProjects.map(project => {
                            const isSelected = selectedProjects.some(p => p.id === project.id);
                            return (
                              <div
                                key={project.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedProjects(prev => prev.filter(p => p.id !== project.id));
                                  } else {
                                    setSelectedProjects(prev => [...prev, project]);
                                  }
                                }}
                                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-blue-50 text-blue-900'
                                    : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'border-slate-300'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-1">
                                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                    {project.title.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{project.title}</div>
                                    {project.details && (
                                      <div className="text-xs text-slate-500 truncate">{project.details}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          {filteredProjects.length === 0 && projectSearchTerm && (
                            <div className="text-center text-slate-500 text-sm py-4">
                              <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              No projects found for "{projectSearchTerm}"
                            </div>
                          )}
                          
                          {projects.length === 0 && (
                            <div className="text-center text-slate-500 text-sm py-4">
                              <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              No projects available
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selectedProjects.length > 0 && (
                    <div className="flex items-center justify-between text-xs text-slate-600 bg-white px-3 py-2 rounded border">
                      <span>{selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} selected</span>
                      <button
                        onClick={() => setSelectedProjects([])}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Clear
                      </button>
                    </div>
                  )}
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