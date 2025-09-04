import React, { useRef, useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  UserIcon,
  Calendar,
  Play,
  Pause,
  Volume2,
  FileText,
  MessageSquare,
  Mic,
  Edit3,
  type LucideIcon,
  ExternalLink,
} from 'lucide-react';
import { type Message, MessageType } from '~/help';
import { TaskStatus, TaskPriority } from '~/types/task';
import { userAtom } from '~/utils/userAtom';
import { useAtomValue } from 'jotai';

interface CurrentUser {
    userId: number;
    name: string;
}

interface TaskMessageDisplayProps {
  message: Message;
  currentUser: CurrentUser | null;
  onUpdateTaskStatus: (messageId: number, newStatus: TaskStatus, updatedByUserId: number) => Promise<void>;
  onPlayVoice: (message: Message) => void;
  playingVoiceId: number | null;
}

interface StatusConfig {
  icon: LucideIcon;
  color: string;
  label: string;
}

interface PriorityConfig {
  color: string;
  label: string;
}

const TaskMessageDisplay: React.FC<TaskMessageDisplayProps> = ({ message, currentUser, onUpdateTaskStatus, onPlayVoice, playingVoiceId }) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const isVoiceMessage = message.fileReference && message.duration && message.duration > 0;
  const isFileMessage = message.fileReference && message.fileName;
  const isPlaying = playingVoiceId === message.id;

  const getStatusConfig = (status: TaskStatus): StatusConfig => {
    const statusConfig = {
      [TaskStatus.Backlog]: {
        icon: Clock,
        color: 'bg-gray-100 text-gray-800',
        label: 'Backlog',
      },
      [TaskStatus.ToDo]: {
        icon: Clock,
        color: 'bg-blue-100 text-blue-800',
        label: 'To Do',
      },
      [TaskStatus.InProgress]: {
        icon: AlertCircle,
        color: 'bg-yellow-100 text-yellow-800',
        label: 'In Progress',
      },
      [TaskStatus.InReview]: {
        icon: AlertCircle,
        color: 'bg-purple-100 text-purple-800',
        label: 'In Review',
      },
      [TaskStatus.Done]: {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800',
        label: 'Done',
      },
    } as const;
    return statusConfig[status] || statusConfig[TaskStatus.Backlog];
  };

  const getPriorityConfig = (priority: TaskPriority): PriorityConfig => {
    const priorityConfig: Record<TaskPriority, PriorityConfig> = {
      [TaskPriority.Low]: {
        color: 'bg-green-100 text-green-800',
        label: 'Low',
      },
      [TaskPriority.Medium]: {
        color: 'bg-yellow-100 text-yellow-800',
        label: 'Medium',
      },
      [TaskPriority.High]: {
        color: 'bg-red-100 text-red-800',
        label: 'High',
      }
    };
    return priorityConfig[priority] || priorityConfig[TaskPriority.Medium];
  };

  const getTaskTypeIcon = (message: Message): LucideIcon => {
    if (message.fileReference && message.duration) return Mic;
    if (message.fileReference && message.fileName) return FileText;
    return MessageSquare;
  };

  const handleStatusUpdate = async (newStatus: TaskStatus) => {
    if (!message.taskId || !currentUser) return;
    
    setIsUpdatingStatus(true);
    try {
      await onUpdateTaskStatus(message.id, newStatus, currentUser.userId);
    } catch (error) {
      console.error('Error updating task status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (message.messageType !== MessageType.Task) {
    return null;
  }

  const statusConfig = getStatusConfig(message.taskStatus!);
  const priorityConfig = getPriorityConfig(message.taskPriority!);
  const TaskTypeIcon = getTaskTypeIcon(message);
  const StatusIcon = statusConfig.icon;

  const isOwner = message.senderId === currentUser?.userId;
  const isAssigned = message.assignedUserIds?.includes(currentUser?.userId ?? -1);
  const canUpdateStatus = isOwner || isAssigned;

  return (
    <div className={`flex ${isOwner ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`max-w-md w-full rounded-2xl shadow-lg border-0 overflow-hidden ${
        isOwner 
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
          : 'bg-white text-gray-900'
      }`}>
        
        <div className={`px-5 py-4 border-b ${
          isOwner ? 'border-blue-400/20' : 'border-gray-100'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isVoiceMessage ? (
                <div className={`p-2 rounded-full ${
                  isOwner ? 'bg-white/20' : 'bg-blue-50'
                }`}>
                  <Mic size={16} className={isOwner ? 'text-white' : 'text-blue-600'} />
                </div>
              ) : isFileMessage ? (
                <div className={`p-2 rounded-full ${
                  isOwner ? 'bg-white/20' : 'bg-green-50'
                }`}>
                  <FileText size={16} className={isOwner ? 'text-white' : 'text-green-600'} />
                </div>
              ) : (
                <div className={`p-2 rounded-full ${
                  isOwner ? 'bg-white/20' : 'bg-gray-50'
                }`}>
                  <MessageSquare size={16} className={isOwner ? 'text-white' : 'text-gray-600'} />
                </div>
              )}
              <span className="font-medium">
                Task {isVoiceMessage ? '(Voice)' : isFileMessage ? '(File)' : ''}
              </span>
            </div>
            
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              isOwner ? 'bg-white/20 text-white' : statusConfig.color
            }`}>
              <StatusIcon size={12} className="inline mr-1" />
              {statusConfig.label}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          
          {message.taskTitle && message.taskTitle !== message.content && (
            <h3 className="font-semibold text-lg leading-tight">{message.taskTitle}</h3>
          )}

          {isVoiceMessage && (
            <div className={`flex items-center justify-between p-4 rounded-xl ${
              isOwner ? 'bg-white/10' : 'bg-gray-50'
            }`}>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onPlayVoice(message)}
                  disabled={!message.fileReference}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isOwner
                      ? 'bg-white/20 hover:bg-white/30 active:scale-95'
                      : 'bg-blue-500 hover:bg-blue-600 text-white active:scale-95'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                
                <div className="flex items-center space-x-2">
                  <Volume2 size={18} className="opacity-70" />
                  <span className="font-medium">{formatTime(message.duration!)}</span>
                </div>
              </div>
            </div>
          )}

          {isFileMessage && (
            <div className={`flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.02] ${
              isOwner ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-50 hover:bg-gray-100'
            }`}>
              <div className="flex items-center space-x-3 min-w-0">
                <div className={`p-2 rounded-lg ${
                  isOwner ? 'bg-white/20' : 'bg-green-100'
                }`}>
                  <FileText size={20} className={isOwner ? 'text-white' : 'text-green-600'} />
                </div>
                
                <div className="min-w-0">
                  <p className="font-medium truncate">{message.fileName}</p>
                  {message.fileSize && message.fileSize > 0 && (
                    <p className={`text-sm ${isOwner ? 'text-white/70' : 'text-gray-500'}`}>
                      {formatFileSize(message.fileSize)}
                    </p>
                  )}
                </div>
              </div>
              
              <div className={`p-2 rounded-full ${
                isOwner ? 'bg-white/20' : 'bg-green-100'
              }`}>
                <ExternalLink size={16} className={isOwner ? 'text-white' : 'text-green-600'} />
              </div>
            </div>
          )}

          {message.content && 
           message.content.trim() !== '' && 
           message.content !== message.fileName && 
           message.content !== message.taskTitle && (
            <div className={`p-3 rounded-xl ${
              isOwner ? 'bg-white/10' : 'bg-gray-50'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
            </div>
          )}

          {!isVoiceMessage && !isFileMessage && message.content && (
            <div className={`p-3 rounded-xl ${
              isOwner ? 'bg-white/10' : 'bg-gray-50'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isOwner ? 'text-white/80' : 'text-gray-600'}`}>
                Priority
              </span>
              <span className={`font-medium ${isOwner ? 'text-white' : priorityConfig.color}`}>
                {priorityConfig.label}
              </span>
            </div>

            {(message.assignedUserIds?.length ?? 0) > 0 && (
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isOwner ? 'text-white/80' : 'text-gray-600'}`}>
                  Assigned
                </span>
                <div className="flex items-center space-x-1">
                  <UserIcon size={14} />
                  <span className="font-medium">
                    {message.assignedUserIds?.length ?? 0} user{message.assignedUserIds?.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}

            {message.dueDate && (
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isOwner ? 'text-white/80' : 'text-gray-600'}`}>
                  Due Date
                </span>
                <div className="flex items-center space-x-1">
                  <Calendar size={14} />
                  <span className="font-medium">
                    {new Date(message.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {canUpdateStatus && (
          <div className={`px-5 py-4 border-t ${
            isOwner ? 'border-blue-400/20' : 'border-gray-100'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isOwner ? 'text-white/90' : 'text-gray-700'}`}>
                Update Status:
              </span>
              <div className="flex space-x-2">
                {Object.values(TaskStatus).map((status) => {
                  const config = getStatusConfig(status);
                  const StatusIconComponent = config.icon;
                  const isCurrentStatus = status === message.taskStatus;
                  
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={isCurrentStatus || isUpdatingStatus}
                      className={`p-2 rounded-lg transition-all ${
                        isCurrentStatus
                          ? isOwner 
                            ? 'bg-white/30 text-white cursor-not-allowed ring-2 ring-white/50'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed ring-2 ring-slate-300'
                          : isOwner
                            ? 'bg-white/10 hover:bg-white/20 text-white hover:scale-105 active:scale-95'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:scale-105 active:scale-95'
                      }`}
                      title={config.label}
                    >
                      <StatusIconComponent size={14} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className={`px-5 py-3 text-xs ${
          isOwner ? 'text-white/70' : 'text-gray-500'
        } border-t ${isOwner ? 'border-blue-400/20' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between">
            <span>
              {message.senderName && !isOwner && (
                <span className="font-medium">{message.senderName} • </span>
              )}
              {new Date(message.createdAt ?? new Date()).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            {message.isEdited && (
              <span className="flex items-center space-x-1 italic">
                <Edit3 size={10} />
                <span>edited</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatWithTaskMessages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const connectedUser = useAtomValue(userAtom);
  const currentUser: CurrentUser = { userId: connectedUser?.userId || 0, name: connectedUser?.fullName || 'Default Name' };
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const baseUrl = "http://localhost:5178";

  const [playingVoiceId, setPlayingVoiceId] = useState<number | null>(null);

  const handleUpdateTaskStatus = async (messageId: number, newStatus: TaskStatus, updatedByUserId: number) => {
    try {
      const response = await fetch(`${baseUrl}/api/Chat/messages/${messageId}/task-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus, 
          updatedByUserId: updatedByUserId 
        })
      });

      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, taskStatus: newStatus }
            : msg
        ));
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  };

  const pauseVoiceMessage = (message: Message) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingVoiceId(null);
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

  const handlePlayVoice = (message: Message) => {
    playVoiceMessage(message);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h2 className="text-2xl font-bold text-center mb-6">Task Messages Demo</h2>
      
      {messages.map(message => (
        <TaskMessageDisplay
          key={message.id}
          message={message}
          currentUser={currentUser}
          onUpdateTaskStatus={handleUpdateTaskStatus}
          onPlayVoice={handlePlayVoice}
          playingVoiceId={playingVoiceId}
        />
      ))}
    </div>
  );
};

export default ChatWithTaskMessages;