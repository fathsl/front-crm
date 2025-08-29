import { CheckCircle, Clock, AlertCircle, Play, Pause } from 'lucide-react';
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
    if (status === (task.taskStatus as TaskStatus) || isUpdating) return;
    
    try {
      setIsUpdating(true);
      await onStatusChange(status);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900">{task.title}</h3>
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded-full ${statusConfig[task.status].color}`}>
            {statusConfig[task.status].label}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
      )}

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

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(({ value, icon: Icon, color, label }) => (
            <button
              key={value}
              onClick={() => handleStatusClick(value)}
              disabled={isUpdating}
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                task.status === value
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Icon className="w-3 h-3 mr-1" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
