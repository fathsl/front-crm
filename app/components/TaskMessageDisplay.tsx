import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle,
  User,
  Calendar,
  Play,
  Pause,
  Volume2,
  FileText,
  MessageSquare,
  Mic,
  Edit3,
  type LucideIcon,
} from 'lucide-react';
import { type Message, MessageType } from '~/help';
import { TaskStatus, TaskPriority } from '~/types/task';

interface CurrentUser {
    userId: number;
    name: string;
}

// Using TaskStatus and TaskPriority from ~/types/task

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
    <div className={`flex ${isOwner ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-md rounded-xl shadow-sm border ${
        isOwner 
          ? 'bg-blue-500 text-white border-blue-600' 
          : 'bg-white text-slate-900 border-slate-200'
      }`}>
        <div className={`px-4 py-3 border-b ${
          isOwner ? 'border-blue-400/30' : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TaskTypeIcon size={16} className={isOwner ? 'text-blue-100' : 'text-blue-600'} />
              <span className="font-medium text-sm">Task</span>
            </div>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${
              isOwner ? 'border-white/20 text-white' : statusConfig.color
            }`}>
              <StatusIcon size={12} />
              <span>{statusConfig.label}</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="mb-3">
            {message.taskTitle && message.taskTitle !== message.content ? (
              <h4 className="font-semibold mb-1">{message.taskTitle}</h4>
            ) : null}
            
            {message.duration ? (
              <div className="flex items-center space-x-3 py-2">
                <button
                  onClick={() => onPlayVoice(message)}
                  className={`p-2 rounded-full transition ${
                    isOwner
                      ? 'bg-white/20 hover:bg-white/30 text-white'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                  }`}
                  disabled={!message.fileReference}
                >
                  {playingVoiceId === message.id ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <div className="flex items-center space-x-2">
                  <Volume2 size={16} className="opacity-70" />
                  <span className="text-sm">{formatTime(message.duration)}</span>
                </div>
              </div>
            ) : message.fileName ? (
              <div className="inline-flex items-center">
                <FileText size={16} className="mr-2" />
                <span>{message.fileName}</span>
                {message.fileSize !== undefined && message.fileSize > 0 && (
                  <span className="ml-2 text-sm opacity-75">
                    ({formatFileSize(message.fileSize)})
                  </span>
                )}
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className={isOwner ? 'text-blue-100' : 'text-slate-600'}>Priority:</span>
              <span className={`font-medium ${isOwner ? 'text-white' : priorityConfig.color}`}>
                {priorityConfig.label}
              </span>
            </div>

            {(message.assignedUserIds?.length ?? 0) > 0 && (
              <div className="flex items-center justify-between">
                <span className={isOwner ? 'text-blue-100' : 'text-slate-600'}>Assigned to:</span>
                <div className="flex items-center space-x-1">
                  <User size={12} />
                  <span className={isOwner ? 'text-white' : 'text-slate-900'}>
                    {message.assignedUserIds?.length ?? 0} user{message.assignedUserIds?.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}

            {message.dueDate && (
              <div className="flex items-center justify-between">
                <span className={isOwner ? 'text-blue-100' : 'text-slate-600'}>Due:</span>
                <div className="flex items-center space-x-1">
                  <Calendar size={12} />
                  <span className={isOwner ? 'text-white' : 'text-slate-900'}>
                    {new Date(message.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {canUpdateStatus && (
          <div className={`px-4 py-3 border-t ${
            isOwner ? 'border-blue-400/30' : 'border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${isOwner ? 'text-blue-100' : 'text-slate-600'}`}>
                Update Status:
              </span>
              <div className="flex space-x-1">
                {Object.values(TaskStatus).map((status) => {
                  const config = getStatusConfig(status);
                  const StatusIconComponent = config.icon;
                  const isCurrentStatus = status === message.taskStatus;
                  
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={isCurrentStatus || isUpdatingStatus}
                      className={`p-1.5 rounded transition-all ${
                        isCurrentStatus
                          ? isOwner 
                            ? 'bg-white/20 text-white cursor-not-allowed'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : isOwner
                            ? 'bg-white/10 hover:bg-white/20 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                      title={config.label}
                    >
                      <StatusIconComponent size={12} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className={`px-4 py-2 text-xs ${
          isOwner ? 'text-blue-100' : 'text-slate-500'
        }`}>
          {message.senderName && !isOwner && (
            <span className="font-medium">{message.senderName} • </span>
          )}
          {new Date(message.createdAt ?? new Date()).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
          {message.isEdited && (
            <span className="ml-1">
              <Edit3 size={10} className="inline" /> edited
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ChatWithTaskMessages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      messageType: MessageType.Task,
      senderId: 1,
      senderName: 'John Doe',
      content: 'Review the project documentation and provide feedback',
      taskId: 101,
      taskTitle: 'Document Review Task',
      taskStatus: TaskStatus.Backlog,
      taskPriority: TaskPriority.High,
      assignedUserIds: [2],
      dueDate: new Date(),
      createdAt: new Date(),
      isEdited: false,
      timestamp: new Date(),
    },
    {
      id: 2,
      messageType: MessageType.Task,
      senderId: 2,
      senderName: 'Jane Smith',
      content: 'Voice task: Meeting notes discussion',
      taskId: 102,
      taskTitle: 'Meeting Notes Review',
      taskStatus: TaskStatus.InProgress,
      taskPriority: TaskPriority.Medium,
      assignedUserIds: [1],
      dueDate: new Date(),
      createdAt: new Date(),
      isEdited: false,
      timestamp: new Date(),
    }
  ]);

  const [playingVoiceId, setPlayingVoiceId] = useState<number | null>(null);
  const currentUser: CurrentUser = { userId: 1, name: 'John Doe' };

  const handleUpdateTaskStatus = async (messageId: number, newStatus: TaskStatus, updatedByUserId: number) => {
    try {
      const response = await fetch(`/api/Chat/messages/${messageId}/task-status`, {
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

  const handlePlayVoice = (message: Message) => {
    console.log('Playing voice message:', message);
    setPlayingVoiceId(playingVoiceId === message.id ? null : message.id);
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