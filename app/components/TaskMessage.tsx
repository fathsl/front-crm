import { CheckCircle, Clock, AlertCircle, Play, Pause, FileText, UserIcon, MoreVertical, Calendar, Volume2 } from 'lucide-react';
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

  const priorityConfig = {
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
    },
  };
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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const StatusIcon = getStatusConfig(currentStatus).icon;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all hover:shadow-xl">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{task.title}</h3>
              <p className="text-sm text-gray-500">Task • {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {task.description && (
          <p className="text-gray-700 text-sm leading-relaxed">{task.description}</p>
        )}

        <div className="flex items-center space-x-3">
          <div className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusConfig(currentStatus).color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{getStatusConfig(currentStatus).label}</span>
          </div>
          <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${priorityConfig[task.priority].color}`}>
            <span>{priorityConfig[task.priority].label} Priority</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {task.dueDate && (
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Due {new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          
          {task.assignedTo && (
            <div className="flex items-center space-x-2">
              <UserIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{task.assignedTo}</span>
            </div>
          )}
        </div>

        {task.duration && onPlayVoice && (
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onPlayVoice}
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{formatTime(task.duration)}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500">Voice message</div>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Update status:</span>
          <div className="flex space-x-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusClick(option.value)}
                disabled={isUpdating || option.value === currentStatus}
                className={`p-2 rounded-lg transition-all flex items-center space-x-1.5 ${
                  option.value === currentStatus
                    ? `${option.color} cursor-default`
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={option.label}
              >
                <option.icon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
