import { AlertCircle, Calendar, Clock, Edit2, Edit3, Flag, MoreVertical, Trash2 } from "lucide-react";
import type { Task, TaskAssignments } from "~/help";
import { TaskPriority, TaskStatus } from "~/types/task";

export const TaskCard: React.FC<{
  task: Task;
  columnId: TaskStatus;
  taskAssignments: TaskAssignments[];
  onEdit: (task: Task) => void;
}> = ({ task, columnId, taskAssignments, onEdit }) => {
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.High: return 'bg-orange-100 text-orange-800 border-orange-200';
      case TaskPriority.Medium: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case TaskPriority.Low: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.Low: return <AlertCircle className="w-3 h-3" />;
      case TaskPriority.Medium: return <AlertCircle className="w-3 h-3" />;
      case TaskPriority.High: return <AlertCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = task.DueDate ? new Date(task.DueDate) < new Date() && task.status !== TaskStatus.Done : false;

  return (
    <div
      draggable
      onDragStart={(e) => {
      }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-move group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(task.priority)}`}>
            {getPriorityIcon(task.priority)}
            {task.priority}
          </span>
        </div>
        <button
          onClick={() => onEdit(task)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
        >
          <Edit3 className="w-3 h-3 text-gray-500" />
        </button>
      </div>

      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{task.title}</h3>
      
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="space-y-2">
        {task.DueDate && (
          <div className={`flex items-center gap-2 text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
            <Calendar className="w-3 h-3" />
            <span className={isOverdue ? 'font-medium' : ''}>{formatDate(task.DueDate || '')}</span>
          </div>
        )}
        
        {task.estimatedTime && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{task.estimatedTime}</span>
          </div>
        )}
      </div>

      {task.assignedUsers && task.assignedUsers.length > 0 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex -space-x-2">
            {task.assignedUsers.slice(0, 3).map((user, index) => (
              <div
                key={user.userId}
                className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                title={user.firstName + ' ' + user.lastName}
              >
                {user.firstName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
              </div>
            ))}
            {task.assignedUsers.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                +{task.assignedUsers.length - 3}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-400">#{task.id}</span>
        </div>
      )}
    </div>
  );
};