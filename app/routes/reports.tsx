import { Calendar, Clock, Edit2, Flag, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TaskCard } from '~/components/TaskCard';
import { TaskModal } from '~/components/TaskModel';
import type { Task, TaskAssignments, User } from '~/help';

export default function Reports() {
  const { t } = useTranslation();

  const [tasks, setTasks] = useState<Record<number, Task[]>>({});
  const [taskId, setTaskId] = useState<number | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<TaskAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<(Task & { sourceColumn: number }) | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<number | null>(null);

  const columns = [
    { id: 0, name: 'Backlog', color: 'bg-gray-100 border-gray-300' },
    { id: 1, name: 'To Do', color: 'bg-blue-50 border-blue-200' },
    { id: 2, name: 'In Progress', color: 'bg-yellow-50 border-yellow-200' },
    { id: 3, name: 'In Review', color: 'bg-purple-50 border-purple-200' },
    { id: 4, name: 'Done', color: 'bg-green-50 border-green-200' }
  ];

  useEffect(() => {
    loadTasks();
    loadUsers();
    loadAllTaskAssignments();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await fetch('http://localhost:5178/api/Task');
      if (response.ok) {
        const data = await response.json();

        console.log("data", data);
        
        
        const tasksByStatus: Record<number, Task[]> = {
          0: [], 1: [], 2: [], 3: [], 4: []
        };
        
        if (data.columns) {
          data.columns.forEach((column: any) => {
            tasksByStatus[column.status] = column.tasks || [];
          });

          console.log("tasksByStatus", tasksByStatus);
        } else if (Array.isArray(data)) {
          data.forEach((task: Task) => {
            if (tasksByStatus[task.status]) {
              tasksByStatus[task.status].push(task);
            }
          });
        }
        
        setTasks(tasksByStatus);
      } else {
        throw new Error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks({
        0: [], 1: [], 2: [], 3: [], 4: []
      });
    }
    setLoading(false);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, columnId: number) => {
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

  const handleDrop = async (e: React.DragEvent, targetColumnId: number) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedTask || draggedTask.sourceColumn === targetColumnId) return;

    try {
      const response = await fetch(`http://localhost:5178/api/tasks/${draggedTask.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetColumnId })
      });

      if (response.ok) {
        const newTasks = { ...tasks };
        newTasks[draggedTask.sourceColumn] = newTasks[draggedTask.sourceColumn].filter(
          task => task.id !== draggedTask.id
        );
        newTasks[targetColumnId] = [...(newTasks[targetColumnId] || []), 
          { ...draggedTask, status: targetColumnId }];
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
      const response = await fetch('http://localhost:5178/api/Task', {
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
        
        const newTasks = { ...tasks };
        newTasks[newTask.status || 0] = [...(newTasks[newTask.status || 0] || []), newTask];
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

  const updateTask = async (taskId: number, taskData: any) => {
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
        Object.keys(newTasks).forEach(status => {
          newTasks[parseInt(status)] = newTasks[parseInt(status)].map(task => 
            task.id === taskId ? updatedTask : task
          );
        });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
        {columns.map((column) => (
          <div
            key={column.id}
            className={`rounded-lg border-2 p-4 min-h-[500px] ${column.color} ${
              dragOverColumn === column.id ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
            }`}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">{column.name}</h2>
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                {tasks[column.id]?.length || 0}
              </span>
            </div>
            
            <div className="space-y-3">
              {(tasks[column.id] || []).map((task) => (
                <TaskCard key={task.id} task={task} columnId={column.id} taskAssignments={taskAssignments} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <TaskModal
        users={users}
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createTask}
        task={editingTask}
        title="Create New Task"
      />

      <TaskModal
        users={users}
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTask(null);
        }}
        onSubmit={(data) => updateTask(editingTask?.id || 0, data)}
        task={editingTask}
        title="Edit Task"
      />
    </div>
  );
}
