import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  User,
  Calendar,
  Play,
  Pause,
  type LucideIcon,
} from 'lucide-react';
import { type Message,  MessageType } from '~/help';
import { TaskPriority, TaskStatus } from '~/types/task';

interface CurrentUser {
    userId: number;
    name: string;
}

interface TaskMessageDisplayProps {
  message: Message & {
    taskId: number;
    taskTitle: string;
    taskStatus: string;
    taskPriority: string;
    assignedUserIds: number[];
    dueDate?: Date;
    createdAt: Date;
    isEdited: boolean;
    timestamp: Date;
    senderName: string;
  };
  currentUser: CurrentUser | null;
  onUpdateTaskStatus: (messageId: number, newStatus: keyof typeof TaskStatus, updatedByUserId: number) => Promise<void>;
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

export const TaskMessageDisplay: React.FC<TaskMessageDisplayProps> = ({ 
  message, 
  currentUser, 
  onUpdateTaskStatus, 
  onPlayVoice, 
  playingVoiceId 
}) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const getStatusConfig = (status: string): StatusConfig => {
    const configs: Record<string, StatusConfig> = {
      [TaskStatus.Backlog]: { 
        icon: Clock, 
        color: 'text-yellow-600 bg-yellow-100 border-yellow-200',
        label: 'Backlog'
      },
      [TaskStatus.ToDo]: {
        icon: AlertCircle,
        color: 'text-blue-600 bg-blue-100 border-blue-200',
        label: 'To Do'
      },
      [TaskStatus.InProgress]: { 
        icon: AlertCircle, 
        color: 'text-blue-600 bg-blue-100 border-blue-200',
        label: 'In Progress'
      },
      [TaskStatus.InReview]: {
        icon: CheckCircle,
        color: 'text-purple-600 bg-purple-100 border-purple-200',
        label: 'In Review'
      },
      [TaskStatus.Done]: { 
        icon: CheckCircle, 
        color: 'text-green-600 bg-green-100 border-green-200',
        label: 'Done'
      }
    };
    return configs[status] || configs[TaskStatus.Backlog];
  };

  const getPriorityConfig = (priority: string): PriorityConfig => {
    const configs: Record<string, PriorityConfig> = {
      [TaskPriority.Low]: { 
        color: 'bg-green-100 text-green-800',
        label: 'Low'
      },
      [TaskPriority.Medium]: { 
        color: 'bg-yellow-100 text-yellow-800',
        label: 'Medium'
      },
      [TaskPriority.High]: { 
        color: 'bg-red-100 text-red-800',
        label: 'High'
      }
    };
    return configs[priority] || configs[TaskPriority.Medium];
  };

  const statusConfig = getStatusConfig(message.taskStatus);
  const priorityConfig = getPriorityConfig(message.taskPriority);
  const StatusIcon = statusConfig.icon;
  const isOwner = currentUser?.userId === message.senderId;
  const isAssigned = message.assignedUserIds?.includes(currentUser?.userId || 0);
  const canUpdateStatus = isOwner || isAssigned;

  const handleStatusChange = async (newStatus: keyof typeof TaskStatus) => {
    if (!currentUser) return;
    
    try {
      setIsUpdatingStatus(true);
      await onUpdateTaskStatus(message.taskId, newStatus, currentUser.userId);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="task-message bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900">{message.taskTitle}</h3>
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded-full ${statusConfig.color} border`}>
            <StatusIcon className="inline w-3 h-3 mr-1" />
            {statusConfig.label}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${priorityConfig.color}`}>
            {priorityConfig.label}
          </span>
        </div>
      </div>

      {message.content && message.content !== message.taskTitle && (
        <p className="text-sm text-gray-600 mb-3">{message.content}</p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <User className="w-3.5 h-3.5 text-gray-400" />
          <span>{message.senderName}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {message.dueDate && (
            <div className="flex items-center">
              <Calendar className="w-3.5 h-3.5 text-gray-400 mr-1" />
              <span>{new Date(message.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          
          {message.duration ? (
            <button 
              onClick={() => onPlayVoice(message)}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              {playingVoiceId === message.id ? (
                <Pause className="w-3.5 h-3.5 mr-1" />
              ) : (
                <Play className="w-3.5 h-3.5 mr-1" />
              )}
              <span>{formatTime(message.duration)}</span>
            </button>
          ) : null}
        </div>
      </div>

      {canUpdateStatus && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {(Object.entries(TaskStatus) as Array<[string, keyof typeof TaskStatus]>).map(([key, statusValue]) => {
              const config = getStatusConfig(statusValue);
              const Icon = config.icon;
              const isActive = message.taskStatus === statusValue;
              
              return (
                <button
                  key={key}
                  onClick={() => handleStatusChange(statusValue)}
                  disabled={isUpdatingStatus || isActive}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    isActive 
                      ? `${config.color} border-transparent`
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default TaskMessageDisplay;
