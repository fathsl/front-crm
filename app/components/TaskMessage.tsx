import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  User, 
  Play, 
  Pause, 
  Volume2, 
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export enum TaskStatus {
  Backlog = 'Backlog',
  ToDo = 'ToDo', 
  InProgress = 'InProgress',
  InReview = 'InReview',
  Done = 'Done'
}

enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High'
}

interface TaskMessageProps {
  task: {
    id: number;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    assignedTo?: string;
    duration?: number;
    taskStatus: TaskStatus;
    taskPriority: TaskPriority;
    fileName?: string;
    fileSize?: number;
    idriveUrl?: string;
    taskId?: number;
  };
  onStatusChange: (status: TaskStatus) => Promise<void>;
  onPlayVoice?: () => void;
  onDownloadFile?: () => void;
  isPlaying?: boolean;
}

export const TaskMessage = ({
  task,
  onStatusChange,
  onPlayVoice,
  onDownloadFile,
  isPlaying = false,
}: TaskMessageProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAllStatuses, setShowAllStatuses] = useState(false);

  const mapNumericStatusToEnum = (numericStatus: number | string): TaskStatus => {
    const statusMap: { [key: number]: TaskStatus } = {
      0: TaskStatus.Backlog,
      1: TaskStatus.ToDo,
      2: TaskStatus.InProgress,
      3: TaskStatus.InReview,
      4: TaskStatus.Done,
    };
    
    const numStatus = typeof numericStatus === 'string' ? parseInt(numericStatus) : numericStatus;
    return statusMap[numStatus] || TaskStatus.Backlog;
  };

  const getCurrentStatus = (): TaskStatus => {
    if (typeof task.status === 'number') {
      return mapNumericStatusToEnum(task.status);
    }
    return task.status || TaskStatus.Backlog;
  };

  const currentStatus = getCurrentStatus();

  const statusConfig = {
    [TaskStatus.Backlog]: {
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      label: 'Backlog',
      bgColor: 'bg-yellow-50'
    },
    [TaskStatus.ToDo]: {
      icon: Clock,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      label: 'To Do',
      bgColor: 'bg-blue-50'
    },
    [TaskStatus.InProgress]: {
      icon: AlertCircle,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      label: 'In Progress',
      bgColor: 'bg-purple-50'
    },
    [TaskStatus.InReview]: {
      icon: AlertCircle,
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      label: 'In Review',
      bgColor: 'bg-indigo-50'
    },
    [TaskStatus.Done]: {
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800 border-green-200',
      label: 'Done',
      bgColor: 'bg-green-50'
    },
  };

  const priorityConfig = {
    [TaskPriority.Low]: {
      color: 'bg-gray-100 text-gray-700',
      label: 'Low',
      dot: 'bg-gray-400'
    },
    [TaskPriority.Medium]: {
      color: 'bg-orange-100 text-orange-700',
      label: 'Medium',
      dot: 'bg-orange-400'
    },
    [TaskPriority.High]: {
      color: 'bg-red-100 text-red-700',
      label: 'High',
      dot: 'bg-red-400'
    },
  };

  const handleStatusClick = async (status: TaskStatus) => {
    if (status === currentStatus || isUpdating) return;
   
    try {
      setIsUpdating(true);
      await onStatusChange(status);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const currentStatusConfig = statusConfig[currentStatus];
  const StatusIcon = currentStatusConfig.icon;
  const taskPriority = task.priority && Object.values(TaskPriority).includes(task.priority as TaskPriority) 
    ? task.priority 
    : TaskPriority.Medium;
  const currentPriorityConfig = priorityConfig[taskPriority] || priorityConfig[TaskPriority.Medium];

  // Get status options using the TaskStatus enum to ensure no duplicates
  const statusOptions = Object.values(TaskStatus).map(status => ({
    status,
    ...(statusConfig as any)[status]
  }));
  const visibleStatuses = showAllStatuses ? statusOptions : statusOptions.slice(0, 3);

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className={`px-4 py-3 ${currentStatusConfig.bgColor} border-b border-gray-100`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 text-sm leading-tight truncate">
              {task.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${currentStatusConfig.color}`}>
                <StatusIcon className="w-3 h-3" />
                <span>{currentStatusConfig.label}</span>
              </div>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${currentPriorityConfig.color}`}>
                <div className={`w-2 h-2 rounded-full ${currentPriorityConfig.dot}`} />
                <span>{currentPriorityConfig.label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {task.description && (
          <p className="text-gray-600 text-sm leading-relaxed mb-3">{task.description}</p>
        )}

        <div className="space-y-2 mb-4">
          {task.dueDate && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          
          {task.assignedTo && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <User className="w-3.5 h-3.5" />
              <span>{task.assignedTo}</span>
            </div>
          )}
        </div>

        {task.duration && onPlayVoice && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={onPlayVoice}
                  className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                </button>
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{formatTime(task.duration)}</span>
                </div>
              </div>
              <div className="text-xs text-gray-400">Voice</div>
            </div>
          </div>
        )}

        {task.fileName && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{task.fileName}</p>
                {task.fileSize && (
                  <p className="text-xs text-gray-500">{formatFileSize(task.fileSize)}</p>
                )}
              </div>
              {onDownloadFile && (
                <button
                  onClick={onDownloadFile}
                  className="ml-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Update Status
            </span>
            {statusOptions.length > 3 && (
              <button
                onClick={() => setShowAllStatuses(!showAllStatuses)}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {showAllStatuses ? (
                  <>Less <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>More <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {statusOptions.slice(0, showAllStatuses ? statusOptions.length : 3).map((statusOption) => (
              <button
                key={statusOption.status}
                onClick={() => handleStatusClick(statusOption.status)}
                disabled={isUpdating || statusOption.status === currentStatus}
                className={`p-2.5 rounded-lg transition-all text-center ${
                  statusOption.status === currentStatus
                    ? `${statusOption.color} border cursor-default`
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-transparent hover:border-gray-200'
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <statusOption.icon className="w-4 h-4" />
                  <span className="text-xs font-medium leading-none">{statusOption.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};