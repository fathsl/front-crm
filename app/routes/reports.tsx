import { AlertCircle, Calendar, CheckCircle2, Eye, PlayCircle, Plus } from 'lucide-react';
import { useEffect,useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TaskCard } from '~/components/TaskCard';
import TaskModal from '~/components/TaskModal';
import type { Task as BaseTask, TaskAssignments, User } from '~/help';
import { TaskStatus } from '~/types/task';

type TaskStatusRecord = {
  [TaskStatus.Backlog]: Task[];
  [TaskStatus.ToDo]: Task[];
  [TaskStatus.InProgress]: Task[];
  [TaskStatus.InReview]: Task[];
  [TaskStatus.Done]: Task[];
};

interface Task extends BaseTask {
  sourceColumn?: TaskStatus;
}

export default function Reports() {
  const { t } = useTranslation();

  const [tasks, setTasks] = useState<TaskStatusRecord>({
    [TaskStatus.Backlog]: [],
    [TaskStatus.ToDo]: [],
    [TaskStatus.InProgress]: [],
    [TaskStatus.InReview]: [],
    [TaskStatus.Done]: []
  });
  const [taskId, setTaskId] = useState<number | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<TaskAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const columns: {
    id: TaskStatus;
    name: string;
    color: string;
    icon: React.ReactNode;
    textColor: string;
  }[] = [
    { 
      id: TaskStatus.Backlog, 
      name: 'Backlog', 
      color: 'bg-gray-100 border-gray-300',
      icon: <AlertCircle className="w-4 h-4" />,
      textColor: 'text-gray-600'
    },
    { 
      id: TaskStatus.ToDo, 
      name: 'To Do', 
      color: 'bg-blue-50 border-blue-200',
      icon: <Calendar className="w-4 h-4" />,
      textColor: 'text-blue-600'
    },
    { 
      id: TaskStatus.InProgress, 
      name: 'In Progress', 
      color: 'bg-yellow-50 border-yellow-200',
      icon: <PlayCircle className="w-4 h-4" />,
      textColor: 'text-yellow-600'
    },
    { 
      id: TaskStatus.InReview, 
      name: 'In Review', 
      color: 'bg-purple-50 border-purple-200',
      icon: <Eye className="w-4 h-4" />,
      textColor: 'text-purple-600'
    },
    { 
      id: TaskStatus.Done, 
      name: 'Done', 
      color: 'bg-green-50 border-green-200',
      icon: <CheckCircle2 className="w-4 h-4" />,
      textColor: 'text-green-600'
    }
  ];

  useEffect(() => {
    loadTasks();
    loadUsers();
    loadAllTaskAssignments();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await fetch('https://api-crm-tegd.onrender.com/api/Task');
      if (response.ok) {
        const data = await response.json();

        const tasksByStatus = {
          [TaskStatus.Backlog]: [],
          [TaskStatus.ToDo]: [],
          [TaskStatus.InProgress]: [],
          [TaskStatus.InReview]: [],
          [TaskStatus.Done]: [],
        } as unknown as Record<TaskStatus, Task[]>;
  
        const statusMap: Record<string, TaskStatus> = {
          '1': TaskStatus.ToDo,
          '2': TaskStatus.InProgress,
          '3': TaskStatus.InReview,
          '4': TaskStatus.Done,
          'ToDo': TaskStatus.ToDo,
          'InProgress': TaskStatus.InProgress,
          'InReview': TaskStatus.InReview,
          'Done': TaskStatus.Done
        };
  
        if (data.columns) {
          data.columns.forEach((column: any) => {
            const status = statusMap[String(column.status)] || TaskStatus.Backlog;
            if (status in tasksByStatus) {
              tasksByStatus[status] = column.tasks || [];
            }
          });
        } else if (Array.isArray(data)) {
          data.forEach((task: Task) => {
            const numericStatus = task.status as unknown as number;
            const status = statusMap[numericStatus] || TaskStatus.Backlog;
            if (status in tasksByStatus) {
              tasksByStatus[status as TaskStatus].push(task);
            }
          });
        } else {
          console.error('Unexpected data format:', data);
        }
  
        console.log('Processed tasks by status:', tasksByStatus);
        setTasks({ ...tasksByStatus });
      } else {
        throw new Error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks({
        [TaskStatus.Backlog]: [],
        [TaskStatus.ToDo]: [],
        [TaskStatus.InProgress]: [],
        [TaskStatus.InReview]: [],
        [TaskStatus.Done]: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllTaskAssignments = async () => {
    try {
      const response = await fetch('https://api-crm-tegd.onrender.com/api/Task/Assignments');
      if (response.ok) {
        const data = await response.json();
        setTaskAssignments(data);
      } else {
        throw new Error('Failed to fetch task assignments');
      }
    } catch (error) {
      console.error('Error loading task assignments:', error);
      setTaskAssignments([]);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('https://api-crm-tegd.onrender.com/api/User');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const [draggedTask, setDraggedTask] = useState<{ id: number; sourceColumn: TaskStatus } | null>(null);

  const handleDragStart = (task: Task, columnId: TaskStatus) => {
    setDraggedTask({
      id: task.id,
      sourceColumn: columnId
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    const related = e.relatedTarget as HTMLElement;
    if (!target.contains(related)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: TaskStatus) => {
    if (!draggedTask) return;
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedTask || draggedTask.sourceColumn === targetColumnId) return;

    try {
      const response = await fetch(`https://api-crm-tegd.onrender.com/api/tasks/${draggedTask.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetColumnId })
      });

      if (response.ok && draggedTask) {
        const newTasks = { ...tasks };
        const sourceColumnTasks = newTasks[draggedTask.sourceColumn] || [];
        newTasks[draggedTask.sourceColumn] = sourceColumnTasks.filter(
          task => task.id !== draggedTask.id
        );
        
        const taskToMove = tasks[draggedTask.sourceColumn]?.find(t => t.id === draggedTask.id);
        if (!taskToMove) return;
        
        const targetColumnTasks = newTasks[targetColumnId] || [];
        newTasks[targetColumnId] = [
          ...targetColumnTasks,
          {
            ...taskToMove,
            status: targetColumnId,
            sourceColumn: targetColumnId
          }
        ];
        setTasks(newTasks);
      } else {
        throw new Error('Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const createTask = async (taskData: any) => {
    try {
      const response = await fetch('https://api-crm-tegd.onrender.com/api/Task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        const newTask = await response.json();
        const taskStatus = (newTask.status as TaskStatus) || TaskStatus.Backlog;
        
        const newTasks = { ...tasks };
        newTasks[taskStatus] = [...(newTasks[taskStatus] || []), newTask];
        setTasks(newTasks);
        setShowCreateModal(false);
      } else {
        throw new Error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  const updateTask = async (taskId: number, taskData: Partial<Task>) => {
    try {
      const response = await fetch(`https://api-crm-tegd.onrender.com/api/Task/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskData,
          updatedAt: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        const updatedTask = await response.json();
        
        const newTasks = { ...tasks };
        Object.values(TaskStatus).forEach(status => {
          if (typeof status === 'number') {
            newTasks[status as TaskStatus] = newTasks[status as TaskStatus].filter(task => 
              task.id !== taskId
            );
          }
        });
        const taskStatus = updatedTask.status as TaskStatus;
        newTasks[taskStatus] = [...(newTasks[taskStatus] || []), updatedTask];
        
        setTasks(newTasks);
        setShowEditModal(false);
        setEditingTask(null);
      } else {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const getTotalTasks = () => {
    return (Object.values(tasks) as Task[][]).reduce((total, columnTasks) => total + columnTasks.length, 0);
  };

  const getCompletionRate = () => {
    const totalTasks = getTotalTasks();
    const completedTasks = tasks[TaskStatus.Done]?.length || 0;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-blue-300 rounded-full animate-spin animation-delay-150"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Task Board
                </h1>
                <p className="text-gray-600 mt-1">Manage and track your project tasks</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{getTotalTasks()}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Total Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{getCompletionRate()}%</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Completed</div>
                </div>
              </div>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                Add Task
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {columns.map((column) => (
            <div
              key={column.id}
              className={`rounded-2xl border-2 p-6 min-h-[600px] transition-all duration-300 ${column.color} ${
                dragOverColumn === column.id 
                  ? 'ring-4 ring-blue-400 ring-opacity-30 transform scale-105' 
                  : 'hover:shadow-lg'
              }`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white shadow-sm ${column.textColor}`}>
                    {column.icon}
                  </div>
                  <div>
                    <h2 className={`font-bold text-lg ${column.textColor}`}>
                      {column.name}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm text-sm font-bold ${column.textColor}`}>
                    {tasks[column.id]?.length || 0}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                {(tasks[column.id] || []).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    columnId={column.id}
                    taskAssignments={taskAssignments}
                    onEdit={handleEditTask}
                    onDragStart={handleDragStart}
                  />
                ))}
                
                {(!tasks[column.id] || tasks[column.id].length === 0) && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                      {column.icon}
                    </div>
                    <p className="text-sm font-medium">No tasks yet</p>
                    <p className="text-xs">Drag tasks here or create new ones</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-6 right-6 bg-white rounded-2xl shadow-lg border border-gray-200 p-4 min-w-[200px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-bold text-gray-900">{getCompletionRate()}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${getCompletionRate()}%` }}
          ></div>
        </div>
      </div>

      {showCreateModal &&
      <TaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createTask}
        title="Create New Task"
      />}

      {showEditModal && editingTask &&
      <TaskModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTask(null);
        }}
        onSubmit={(taskData) => updateTask(editingTask.id, taskData)}
        title="Edit Task"
        initialData={editingTask}
      />}
    </div>
  );
}