import { useAtomValue } from 'jotai';
import { AlertCircle, Calendar, CheckCircle2, Eye, PlayCircle, Plus } from 'lucide-react';
import { useEffect,useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { TaskCard } from '~/components/TaskCard';
import TaskModal from '~/components/TaskModal';
import type { Task as BaseTask, Message, TaskAssignments, User } from '~/help';
import { TaskPriority, TaskStatus } from '~/types/task';
import { userAtom } from '~/utils/userAtom';

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

interface TaskFormData {
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string;
  estimatedTime: string;
  assignedToUserId: number[];
  sortOrder: number;
}

interface MessageResponse {
  id: number;
  discussionId: number;
  senderId: number;
  receiverId?: number | null;
  content: string;
  messageType: number;
  taskId?: number;
  taskTitle?: string;
  taskDescription?: string | null;
  taskStatus?: string;
  taskPriority?: string;
  dueDate?: string | null;
  estimatedTime?: string | null;
  sortOrder?: number;
  assignedUserIds?: number[];
  clientIds?: number[];
  projectIds?: number[];
  createdAt: string;
  hasFile?: boolean;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  fileReference?: string | null;
  duration?: number | null;
  audioUrl?: string | null;
}

export default function Reports() {
  const { t } = useTranslation();
  const { id } = useParams();

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
  const [draggedTask, setDraggedTask] = useState<(Task & { sourceColumn: TaskStatus }) | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const currentUser = useAtomValue(userAtom) as unknown as User;
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
      const response = await fetch(`http://localhost:5178/api/Chat/discussion/${id}/tasks-and-media`);
      if (response.ok) {
        const data = await response.json();
        console.log('Raw API response:', data);
  
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
  
        if (data.tasks && Array.isArray(data.tasks)) {
          data.tasks.forEach((task: Task) => {
            const status = statusMap[String(task.status)] || TaskStatus.Backlog;
            if (status in tasksByStatus) {
              tasksByStatus[status].push(task);
            }
          });
        } else {
          console.error('Unexpected data format - expected tasks array:', data);
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
      const response = await fetch('http://localhost:5178/api/Task/Assignments');
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
      const response = await fetch('http://localhost:5178/api/User');
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

  const handleDragStart = (task: Task, sourceColumn: TaskStatus) => {
    setDraggedTask({
      ...task,
      sourceColumn,
    });
  };

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    if (draggedTask?.sourceColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragEnter = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    if (draggedTask?.sourceColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    const related = e.relatedTarget as HTMLElement;
    if (!target.contains(related)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    try {
      const data = e.dataTransfer.getData('text/plain');
      if (!data) return;
      
      const { taskId, sourceColumn } = JSON.parse(data);
      
      if (sourceColumn === targetColumnId) return;
      
      const sourceTasks = [...tasks[sourceColumn as TaskStatus]];
      const taskIndex = sourceTasks.findIndex(t => t.id === taskId);
      
      if (taskIndex === -1) return;
      
      const taskToMove = sourceTasks[taskIndex];
      
      if (!currentUser) {
        console.error('Current user not available');
        return;
      }
      const response = await fetch(`http://localhost:5178/api/Task/${taskToMove.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetColumnId,
          updatedByUserId: currentUser.userId
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to update task status:', errorData);
        throw new Error('Failed to update task status');
      }
      
      const newTasks = { ...tasks };
      
      newTasks[sourceColumn as TaskStatus] = newTasks[sourceColumn as TaskStatus].filter(
        task => task.id !== taskToMove.id
      );
      
      newTasks[targetColumnId] = [
        ...(newTasks[targetColumnId] || []),
        {
          ...taskToMove,
          status: targetColumnId,
          sourceColumn: targetColumnId
        }
      ];
      
      setTasks(newTasks);
      console.log(`Task ${taskToMove.id} moved from ${sourceColumn} to ${targetColumnId}`);
      
    } catch (error) {
      console.error('Error updating task status:', error);
    } finally {
      setDraggedTask(null);
    }
  };

  const createTask = async (discussionId: number, taskData: TaskFormData) => {
    try {
      const requestBody = {
        discussionId,
        senderId: currentUser?.userId ?? 0,
        content: taskData.title,
        messageType: 3,
        taskTitle: taskData.title,
        taskDescription: taskData.description || null,
        taskStatus: taskData.status || 'ToDo',
        taskPriority: taskData.priority || 'Medium',
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null,
        estimatedTime: taskData.estimatedTime || null,
        sortOrder: taskData.sortOrder || 0,
        assignedUserIds: taskData.assignedToUserId || [],
        clientIds: [],
        projectIds: [],
    };

      console.log('Request body being sent:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`http://localhost:5178/api/Chat/discussions/${discussionId}/create-task-with-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
      });

      if (response.ok) {
          const result: MessageResponse = await response.json();
          const taskStatus = result.taskStatus || 'ToDo';
          const newTasks = { ...tasks };
          newTasks[taskStatus] = [...(newTasks[taskStatus] || []), {
              id: result.taskId || 0,
              title: result.taskTitle || '',
              description: result.taskDescription || '',
              status: (result.taskStatus as TaskStatus) || TaskStatus.ToDo,
              priority: (result.taskPriority as TaskPriority) || TaskPriority.Medium,
              DueDate: result.dueDate || '',
              estimatedTime: result.estimatedTime || '',
              SortOrder: result.sortOrder || 0,
              createdByUserId: result.senderId,
              assignedUsers: []
          }];
          setTasks(newTasks);
          setMessages(prev => [...prev, {
            id: result.id,
            discussionId: result.discussionId,
            senderId: result.senderId,
            content: result.content,
            messageType: result.messageType,
            taskId: result.taskId ,
            createdAt: new Date(result.createdAt),
            assignedUserIds: result.assignedUserIds || [],
            timestamp: new Date(result.createdAt).getTime(),
          }]);
          setShowCreateModal(false);

          console.log(`Task and message created successfully with Task ID: ${result.taskId}, Message ID: ${result.id}, and linked to discussion ${discussionId}`);
      } else {
          const errorData = await response.json();
          console.error('Server error response:', errorData);
          throw new Error(errorData.message || 'Failed to create task and message for discussion');
      }
      } catch (error: any) {
          console.error('Error creating task for discussion:', error);
          alert(error.message || 'Failed to create task. Please try again.');
      }
  };

  const updateTask = async (taskId: number, taskData: Partial<Task>) => {
    try {
      const response = await fetch(`http://localhost:5178/api/Task/${taskId}`, {
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
            className={`bg-white/50 backdrop-blur-sm rounded-2xl border ${column.color} p-4 transition-all duration-200 ${dragOverColumn === column.id ? 'ring-2 ring-offset-2 ring-offset-blue-100 ring-blue-500 scale-105' : ''}`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragEnter={(e) => handleDragEnter(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`${column.textColor}`}>
                  {column.icon}
                </span>
                <h3 className="font-semibold text-gray-800">{column.name}</h3>
                <span className="text-xs bg-white/50 text-gray-600 px-2 py-0.5 rounded-full">
                  {tasks[column.id]?.length || 0}
                </span>
              </div>
              {column.id === TaskStatus.Backlog && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {tasks[column.id]?.map((task) => (
                <div 
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task, column.id)}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <TaskCard 
                    task={task} 
                    columnId={column.id} 
                    taskAssignments={taskAssignments}
                    onEdit={handleEditTask}
                    onDragStart={handleDragStart}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
    
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 py-2 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">{getCompletionRate()}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${getCompletionRate()}%` }}
          ></div>
        </div>
      </div>
    </div>

    {showCreateModal && (
      <TaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(taskData) => createTask(Number(id), taskData)}
        title="Create New Task"
      />
    )}

    {showEditModal && editingTask && (
      <TaskModal 
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTask(null);
        }}
        onSubmit={(taskData) => editingTask && updateTask(editingTask.id, taskData)}
        title="Edit Task"
        initialData={editingTask}
      />
    )}
  </div>
);
}