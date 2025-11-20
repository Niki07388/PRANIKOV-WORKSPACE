import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MockBackend } from '../services/api';
import { Project, UserRole } from '../types';
import { 
  Folder, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Plus
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (user) {
        try {
          const data = await MockBackend.getProjects(user.id, user.role);
          if (Array.isArray(data)) {
            setProjects(data);
          } else {
            console.error('Expected projects array but got:', data);
            setProjects([]);
          }
        } catch (err) {
          console.error('Failed to fetch projects:', err);
          setProjects([]);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProjects();
  }, [user]);

  const navigateToProject = (id: string) => {
    window.location.hash = `#/project/${id}`;
  };

  const navigateToCreate = () => {
    window.location.hash = '#/create-project';
  };

  // Stats Calculation
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.progress === 100).length;
  const ongoingProjects = totalProjects - completedProjects;
  const avgProgress = totalProjects > 0 
    ? Math.round(projects.reduce((acc, curr) => acc + curr.progress, 0) / totalProjects) 
    : 0;

  const data = [
    { name: 'Completed', value: completedProjects },
    { name: 'Ongoing', value: ongoingProjects },
  ];
  const COLORS = ['#10B981', '#6366F1'];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Hello, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here's what's happening in your workspace today.
          </p>
        </div>
        {user?.role === UserRole.MANAGER && (
          <button 
            onClick={navigateToCreate}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <Plus size={20} />
            <span>Create Project</span>
          </button>
        )}
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Projects</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{ongoingProjects}</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <Folder className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Progress</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{avgProgress}%</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hidden md:block transition-colors">
           <div className="h-20 w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={35}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="ml-4">
                 <p className="text-xs text-gray-500 dark:text-gray-400">Completion Rate</p>
              </div>
           </div>
        </div>
      </div>

      {/* Projects Grid */}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div 
            key={project.id}
            onClick={() => navigateToProject(project.id)}
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all cursor-pointer overflow-hidden flex flex-col h-full"
          >
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  project.progress === 100 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' 
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                }`}>
                  {project.progress === 100 ? 'Completed' : 'In Progress'}
                </div>
                <span className="text-xs text-gray-400 flex items-center">
                  <Clock size={12} className="mr-1" />
                  Due {new Date(project.deadline).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {project.projectName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                {project.description}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-4">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    project.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{project.progress}% Complete</span>
                <div className="flex -space-x-2">
                  {/* Fake avatars based on assigned IDs */}
                  {project.assignedUserIds.slice(0, 3).map((uid, i) => (
                    <img 
                      key={uid}
                      className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
                      src={`https://picsum.photos/seed/${uid}/30/30`}
                      alt="User"
                    />
                  ))}
                  {project.assignedUserIds.length > 3 && (
                     <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
                       +{project.assignedUserIds.length - 3}
                     </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end text-indigo-600 dark:text-indigo-400 font-medium text-sm group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
              Open Project <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full bg-white dark:bg-gray-800 p-12 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-center transition-colors">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-full mb-4">
              <AlertCircle className="text-gray-400 dark:text-gray-300" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Projects Found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">You haven't been assigned to any projects yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};