
import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CreateProject } from './pages/CreateProject';
import { ProjectDetails } from './pages/ProjectDetails';

// Simple Hash Router implementation
const Router = () => {
  const { user, loading } = useAuth();
  const [route, setRoute] = useState(window.location.hash || '#/login');

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium animate-pulse">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  // Public Route
  if (!user) {
    if (route !== '#/login') {
      window.location.hash = '#/login'; // Redirects to login if not authenticated
      return <Login />;
    }
    return <Login />;
  }

  // Protected Routes
  const renderPage = () => {
    if (route === '#/login') {
      window.location.hash = '#/dashboard';
      return <Dashboard />;
    }
    if (route === '#/dashboard' || route === '') return <Dashboard />;
    if (route === '#/create-project') return <CreateProject />;
    if (route.startsWith('#/project/')) return <ProjectDetails />;
    
    return <div className="flex h-full items-center justify-center text-gray-500 font-medium">404 | Page Not Found</div>;
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
};

export default App;
