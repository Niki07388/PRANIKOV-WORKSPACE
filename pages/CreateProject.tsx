import React, { useEffect, useState } from 'react';
import { UserRole, User, Project } from '../types';
import { MockBackend } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, Users } from 'lucide-react';

export const CreateProject: React.FC = () => {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    deadline: '',
    assignedUserIds: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== UserRole.MANAGER) {
        window.location.hash = '#/dashboard';
        return;
    }
    const loadUsers = async () => {
      const users = await MockBackend.getUsers();
      // Filter out the current manager so they don't assign themselves recursively, or allow it.
      // Showing employees primarily.
      setAllUsers(users.filter(u => u.role === UserRole.EMPLOYEE));
    };
    loadUsers();
  }, [user]);

  const handleToggleUser = (userId: string) => {
    setFormData(prev => {
      const isSelected = prev.assignedUserIds.includes(userId);
      if (isSelected) {
        return { ...prev, assignedUserIds: prev.assignedUserIds.filter(id => id !== userId) };
      } else {
        return { ...prev, assignedUserIds: [...prev.assignedUserIds, userId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!user) return;
    setLoading(true);

    const newProject: Project = {
      id: `p${Date.now()}`,
      projectName: formData.projectName,
      description: formData.description,
      deadline: formData.deadline,
      createdBy: user.id,
      assignedUserIds: formData.assignedUserIds,
      progress: 0,
      checkpoints: [], 
    };

    await MockBackend.createProject(newProject);
    setLoading(false);
    window.location.hash = `#/project/${newProject.id}`;
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button 
        onClick={() => window.history.back()}
        className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={18} className="mr-2" />
        Back to Dashboard
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="p-8 border-b border-gray-100 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Project</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Set up the project details and assign your team.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project Name</label>
              <input
                required
                type="text"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="e.g. Q4 Marketing Campaign"
                value={formData.projectName}
                onChange={e => setFormData({...formData, projectName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea
                required
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Brief overview of the project goals..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deadline</label>
              <input
                required
                type="date"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                value={formData.deadline}
                onChange={e => setFormData({...formData, deadline: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <Users size={16} className="mr-2" />
                Assign Team Members
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                {allUsers.map(u => (
                  <div 
                    key={u.id}
                    onClick={() => handleToggleUser(u.id)}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.assignedUserIds.includes(u.id)
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 ring-1 ring-indigo-500'
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-indigo-300'
                    }`}
                  >
                    <img src={u.avatar} alt="" className="w-8 h-8 rounded-full" />
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                    </div>
                    <div className={`ml-auto w-5 h-5 rounded-full border flex items-center justify-center ${
                        formData.assignedUserIds.includes(u.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 dark:border-gray-500'
                    }`}>
                        {formData.assignedUserIds.includes(u.id) && (
                            <Users size={12} className="text-white" />
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md"
            >
              {loading ? 'Creating...' : <><Save size={20} /> <span>Create Project</span></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};