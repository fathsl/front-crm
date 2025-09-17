import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { TaskPriority, TaskStatus } from '~/types/task';
import type { Client, Project, Task } from '~/help';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: any) => void;
  title: string;
  initialData?: Task | null;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen,
  onClose,
  onSubmit,
  title,
  initialData
}) => {
  interface TaskFormData {
    title: string;
    description: string;
    priority: string;
    status: string;
    dueDate: string;
    estimatedTime: string;
    assignedToUserId: number[];
  }

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: '1',
    status: 'ToDo',
    dueDate: '',
    estimatedTime: '',
    assignedToUserId: []
  });

  const [loading, setLoading] = useState(false);
  const [selectedClients, setSelectedClients] = useState<Client[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState('');
  const baseUrl = "https://api-crm-tegd.onrender.com";
  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/Clients`);
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      } else {
        throw new Error('Failed to fetch clients');
      }
    } catch (err) {
      setError('Kullanıcılar yüklenirken hata oluştu');
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/Project`);
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Projects fetch error:', error);
      }
    };
  
    useEffect(() => {
      fetchProjects();
    }, []);

useEffect(() => {
  fetchClients();
}, []);

  const priorityToFormValue = (priority: string | number): string => {
    if (typeof priority === 'number') {
      return priority.toString();
    }
    switch (priority) {
      case 'Low': return '0';
      case 'Medium': return '1';
      case 'High': return '2';
      default: return '1';
    }
  };

  useEffect(() => {
    if (initialData) {
      const priorityValue = priorityToFormValue(initialData.priority);
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        priority: priorityValue,
        status: initialData.status?.toString() || 'ToDo',
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
        estimatedTime: initialData.estimatedTime || '',
        assignedToUserId: initialData.assignedUsers ? initialData.assignedUsers.map(user => user.userId) : []
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: '1',
        status: 'ToDo',
        dueDate: '',
        estimatedTime: '',
        assignedToUserId: []
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        priority: parseInt(formData.priority),
        DueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        clientIds: selectedClients.map(client => client.id),
        projectIds: selectedProjects.map(project => project.id)
      };
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
      <div className="bg-white rounded-l-2xl w-full max-w-md h-full overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter task title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter task description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="0">Low</option>
                <option value="1">Medium</option>
                <option value="2">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={TaskStatus.ToDo}>To Do</option>
                <option value={TaskStatus.InProgress}>In Progress</option>
                <option value={TaskStatus.InReview}>Review</option>
                <option value={TaskStatus.Backlog}>Backlog</option>
                <option value={TaskStatus.Done}>Done</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Time
              </label>
              <input
                type="number"
                name="estimatedTime"
                value={formData.estimatedTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 2 (in hours)"
                min="0"
                step="0.5"
              />
            </div>

            <div>
            <div className="text-sm text-slate-600 mb-2">Clients:</div>
            <div className="space-y-2">
              {selectedClients.map(client => (
                <div key={client.id} className="flex items-center justify-between bg-white px-2 py-1 rounded border">
                  <span className="text-sm">{client.first_name}</span>
                  <button
                    onClick={() => setSelectedClients(prev => prev.filter(c => c.id !== client.id))}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <select
                value=""
                onChange={(e) => {
                  const clientId = parseInt(e.target.value);
                  const client = clients.find(c => c.id === clientId);
                  if (client && !selectedClients.find(c => c.id === clientId)) {
                    setSelectedClients(prev => [...prev, client]);
                  }
                }}
                className="w-full text-sm border border-slate-300 rounded px-2 py-1 bg-white"
              >
                <option value="">Add client...</option>
                {clients.filter(client => !selectedClients.find(c => c.id === client.id)).map(client => (
                  <option key={client.id} value={client.id}>
                    {client.first_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-slate-600 mb-2">Projects:</div>
            <div className="space-y-2">
              {selectedProjects.map(project => (
                <div key={project.id} className="flex items-center justify-between bg-white px-2 py-1 rounded border">
                  <span className="text-sm">{project.title}</span>
                  <button
                    onClick={() => setSelectedProjects(prev => prev.filter(p => p.id !== project.id))}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <select
                value=""
                onChange={(e) => {
                  const projectId = parseInt(e.target.value);
                  const project = projects.find(p => p.id === projectId);
                  if (project && !selectedProjects.find(p => p.id === projectId)) {
                    setSelectedProjects(prev => [...prev, project]);
                  }
                }}
                className="w-full text-sm border border-slate-300 rounded px-2 py-1 bg-white"
              >
                <option value="">Add project...</option>
                {projects.filter(project => !selectedProjects.find(p => p.id === project.id)).map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? 'Saving...' : (initialData ? 'Update Task' : 'Create Task')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;