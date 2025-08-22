import { useEffect, useState } from "react";
import { Status, type Task, type User } from "~/help";

export const TaskModal = ({ show, onClose, onSubmit, task, title,users }: {
    show: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    task?: Task | null;
    title: string;
    users: User[];
  }) => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      status: Status.Backlog,
      priority: 1,
      estimatedTime: '',
      dueDate: '',
      sortOrder: 0,
      assignedUserIds: [] as number[],
    });
  
    const priorities = [
      { id: 0, name: 'Low' },
      { id: 1, name: 'Medium' },
      { id: 2, name: 'High' },
      { id: 3, name: 'Urgent' }
    ];
  
    const statuses = [
      { id: 0, name: 'Backlog' },
      { id: 1, name: 'Todo' },
      { id: 2, name: 'In Progress' },
      { id: 3, name: 'In Review' },
      { id: 4, name: 'Done' }
    ];    
    
    useEffect(() => {
      if (task) {
        setFormData({
          title: task.title || '',
          description: task.description || '',
          status: task.status ?? Status.Backlog,
          priority: task.priority ?? 1,
          estimatedTime: task.estimatedTime || '',
          dueDate: task.DueDate ? new Date(task.DueDate).toISOString().split('T')[0] : '',
          sortOrder: task.SortOrder ?? 0,
          assignedUserIds: task.assignedUsers?.map(u => u.userId) || []
        });
      } else {
        setFormData({
          title: '',
          description: '',
          status: Status.Backlog,
          priority: 1,
          estimatedTime: '',
          dueDate: '',
          sortOrder: 0,
          assignedUserIds: []
        });
      }
    }, [task, show]);
    
  
    const handleSubmit = () => {
      if (!formData.title.trim()) {
        alert('Please enter a task title');
        return;
      }
  
      const submitData = {
        Title: formData.title,
        Description: formData.description,
        Status: formData.status,
        Priority: formData.priority,
        EstimatedTime: formData.estimatedTime,
        DueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        SortOrder: formData.sortOrder,
        AssignedUserIds: formData.assignedUserIds
      };
  
      onSubmit(submitData);
    };
  
    if (!show) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">{title}</h2>
            <div className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
  
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
  
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {priorities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time</label>
                <input
                  type="text"
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Users</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {users.map(user => (
                    <label key={user.userId} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.assignedUserIds.includes(user.userId)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...formData.assignedUserIds, user.userId]
                            : formData.assignedUserIds.filter(id => id !== user.userId);
                          setFormData({ ...formData, assignedUserIds: updated });
                        }}
                      />
                      <span>{user.fullName}</span>
                    </label>
                  ))}
                </div>
              </div>
  
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  {task ? 'Update' : 'Create'} Task
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
  
            </div>
          </div>
        </div>
      </div>
    );
  };
  