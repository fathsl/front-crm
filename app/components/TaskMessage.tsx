import { CheckCircle, Clock, AlertCircle, Play, Pause, FileText } from 'lucide-react';
import { useState } from 'react';
import { TaskStatus, TaskPriority } from '~/types/task';

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
  };
  onStatusChange: (status: TaskStatus) => Promise<void>;
  onPlayVoice?: () => void;
  isPlaying?: boolean;
}

export const TaskMessage = ({
  task,
  onStatusChange,
  onPlayVoice,
  isPlaying = false,
}: TaskMessageProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

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

  const defaultStatus = {
    icon: AlertCircle,
    color: 'bg-gray-100 text-gray-800',
    label: 'Unknown',
  } as const;

  const statusConfig = {
    [TaskStatus.Backlog]: {
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800',
      label: 'Backlog',
    },
    [TaskStatus.ToDo]: {
      icon: Clock,
      color: 'bg-blue-100 text-blue-800',
      label: 'To Do',
    },
    [TaskStatus.InProgress]: {
      icon: AlertCircle,
      color: 'bg-purple-100 text-purple-800',
      label: 'In Progress',
    },
    [TaskStatus.InReview]: {
      icon: AlertCircle,
      color: 'bg-indigo-100 text-indigo-800',
      label: 'In Review',
    },
    [TaskStatus.Done]: {
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800',
      label: 'Done',
    },
  } as const;

  const getStatusConfig = (status?: TaskStatus) => {
    return status ? statusConfig[status] || defaultStatus : defaultStatus;
  };

  const priorityColors = {
    [TaskPriority.Low]: 'bg-green-100 text-green-800',
    [TaskPriority.Medium]: 'bg-yellow-100 text-yellow-800',
    [TaskPriority.High]: 'bg-red-100 text-red-800',
  } as const;

  const statusOptions = Object.entries(statusConfig).map(([value, config]) => ({
    value: value as TaskStatus,
    ...config,
  }));

  const handleStatusClick = async (status: TaskStatus) => {
    if (status === currentStatus || isUpdating) return;
   
    try {
      setIsUpdating(true);
      await onStatusChange(status);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 max-w-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-gray-900 text-sm">Task</span>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              getStatusConfig(currentStatus).color
            }`}
          >
            {getStatusConfig(currentStatus).label}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-full ${priorityColors[task.priority]}`}
          >
            {task.priority}
          </span>
        </div>
      </div>
      
      <div className="mb-3">
        <h3 className="font-medium text-gray-900 text-sm mb-1">{task.title}</h3>
        {task.description && (
          <p className="text-gray-600 text-xs">{task.description}</p>
        )}
      </div>

    <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
      {task.dueDate && (
        <div className="flex items-center">
          <Clock className="w-3.5 h-3.5 text-gray-400 mr-1" />
          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
        </div>
      )}

      {task.duration && onPlayVoice && (
        <button
          onClick={onPlayVoice}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 mr-1" />
          ) : (
            <Play className="w-3.5 h-3.5 mr-1" />
          )}
          <span>{formatTime(task.duration)}</span>
        </button>
      )}
    </div>

    <div className="flex flex-wrap gap-1 mb-3">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleStatusClick(option.value)}
            disabled={isUpdating || option.value === currentStatus}
            className={`text-xs px-2 py-1 rounded-full transition-colors ${
              option.value === currentStatus
                ? option.color
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
            } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
  </div>
  );
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
