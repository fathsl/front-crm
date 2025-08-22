import { Calendar, Clock, Edit2, Flag, MoreVertical, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { Task, TaskAssignments } from "~/help";

export  const TaskCard = ({ task, columnId, taskAssignments }: { task: Task; columnId: number; taskAssignments: TaskAssignments[] }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [tasks, setTasks] = useState<Record<number, Task[]>>({});
    const [draggedTask, setDraggedTask] = useState<(Task & { sourceColumn: number }) | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<number | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const draggedElement = useRef<HTMLElement | null>(null);

    const getAssignedUsersForTask = () => {
       const assignedUsers = taskAssignments.filter(assignment => assignment.taskId === task.id);
       return assignedUsers;
    };

    const priorities = [
        { id: 0, name: 'Low', color: 'text-gray-500 bg-gray-100' },
        { id: 1, name: 'Medium', color: 'text-blue-600 bg-blue-100' },
        { id: 2, name: 'High', color: 'text-orange-600 bg-orange-100' },
        { id: 3, name: 'Urgent', color: 'text-red-600 bg-red-100' }
    ];

    const handleDragStart = (e: React.DragEvent, task: Task, columnId: number) => {
        setDraggedTask({ ...task, sourceColumn: columnId });
        draggedElement.current = e.target as HTMLElement;
        (e.target as HTMLElement).style.opacity = '0.5';
      };
    
      const handleDragEnd = (e: React.DragEvent) => {
        (e.target as HTMLElement).style.opacity = '1';
        setDraggedTask(null);
        setDragOverColumn(null);
      };
    const getPriorityInfo = (priority: number) => priorities[priority] || priorities[1];
    const priorityInfo = getPriorityInfo(task.priority);

    const deleteTask = async (taskId: number) => {
        if (!confirm('Are you sure you want to delete this task?')) {
          return;
        }
    
        try {
          const response = await fetch(`http://localhost:5178/api/Task/${taskId}`, { 
            method: 'DELETE' 
          });
          
          if (response.ok) {
            const newTasks = { ...tasks };
            Object.keys(newTasks).forEach(status => {
              newTasks[parseInt(status)] = newTasks[parseInt(status)].filter(task => task.id !== taskId);
            });
            setTasks(newTasks);
          } else {
            throw new Error('Failed to delete task');
          }
        } catch (error) {
          console.error('Error deleting task:', error);
          alert('Failed to delete task. Please try again.');
        }
      };
    
    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, task, columnId)}
        onDragEnd={handleDragEnd}
        className="bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm hover:shadow-md transition-all cursor-move relative group"
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-gray-900 text-sm leading-5 pr-2">{task.title}</h3>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-opacity"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                <button
                  onClick={() => {
                    setEditingTask(task);
                    setShowEditModal(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    deleteTask(task.id);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        
        {task.description && (
          <p className="text-gray-600 text-xs mb-3 line-clamp-2">{task.description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}>
              <Flag className="w-3 h-3 inline mr-1" />
              {priorityInfo.name}
            </span>
            {task.estimatedTime && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {task.estimatedTime}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {getAssignedUsersForTask()?.slice(0, 3).map((assignment, index) => (
              <div
                key={assignment.userId}
                className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 border-2 border-white"
                title={assignment.userName}
                style={{ marginLeft: index > 0 ? '-8px' : '0' }}
              >
                {assignment.userName?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
            ))}
            {getAssignedUsersForTask()?.length > 3 && (
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white -ml-2">
                +{getAssignedUsersForTask().length - 3}
              </div>
            )}
          </div>
        </div>
        
        {task.DueDate && (
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            {new Date(task.DueDate).toLocaleDateString()}
          </div>
        )}
      </div>
    );
  };