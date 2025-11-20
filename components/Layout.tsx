import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  PlusCircle, 
  LogOut, 
  Menu, 
  X,
  Briefcase,
  Sun,
  Moon,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, theme, toggleTheme, notifications, removeNotification } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    window.location.hash = '#/login';
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <div 
      onClick={() => {
        window.location.hash = to;
        setIsMobileMenuOpen(false);
      }}
      className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer transition-colors rounded-lg mb-1"
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden transition-colors duration-200">
      {/* Toast Notifications Container */}
      <div className="fixed top-5 right-5 z-[60] flex flex-col space-y-2 pointer-events-none">
        {notifications.map((note) => (
          <div 
            key={note.id}
            className={`pointer-events-auto flex items-center p-4 rounded-lg shadow-lg text-white transform transition-all duration-300 animate-in slide-in-from-right-5 ${
              note.type === 'success' ? 'bg-emerald-600' :
              note.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
            }`}
          >
            <div className="mr-3">
              {note.type === 'success' && <CheckCircle size={20} />}
              {note.type === 'error' && <AlertCircle size={20} />}
              {note.type === 'info' && <Info size={20} />}
            </div>
            <span className="font-medium text-sm">{note.message}</span>
            <button 
              onClick={() => removeNotification(note.id)}
              className="ml-4 hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 dark:bg-gray-950 text-white shadow-xl z-10 transition-colors duration-200">
        <div className="p-6 flex items-center space-x-3 border-b border-gray-800 dark:border-gray-800">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <Briefcase size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">PRANIKOV</h1>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Workspace</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto">
          <NavItem to="#/dashboard" icon={LayoutDashboard} label="Dashboard" />
          {user?.role === UserRole.MANAGER && (
            <NavItem to="#/create-project" icon={PlusCircle} label="New Project" />
          )}
        </nav>

        <div className="p-4 border-t border-gray-800 dark:border-gray-800">
          {/* Theme Toggle Desktop */}
          <button 
            onClick={toggleTheme}
            className="flex w-full items-center space-x-3 px-4 py-2 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors mb-2"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>

          <div className="flex items-center space-x-3 px-4 py-3 mb-2">
            <img 
              src={user?.avatar || "https://via.placeholder.com/40"} 
              alt="Profile" 
              className="w-8 h-8 rounded-full border-2 border-indigo-500"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate capitalize">{user?.role ? user.role.toLowerCase() : ''}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center space-x-3 px-4 py-2 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-900 dark:bg-gray-950 text-white h-16 flex items-center justify-between px-4 z-50 shadow-md transition-colors duration-200">
        <div className="flex items-center space-x-2">
           <div className="bg-indigo-500 p-1.5 rounded-lg">
            <Briefcase size={20} className="text-white" />
          </div>
          <span className="font-bold">PRANIKOV</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-gray-900/95 dark:bg-gray-950/95 z-40 pt-20 md:hidden backdrop-blur-sm">
          <nav className="p-4 space-y-2">
            <NavItem to="#/dashboard" icon={LayoutDashboard} label="Dashboard" />
            {user?.role === UserRole.MANAGER && (
               <NavItem to="#/create-project" icon={PlusCircle} label="New Project" />
            )}
            
             <div className="border-t border-gray-700 my-4 pt-4">
               <div className="flex items-center space-x-3 px-4 mb-4">
                  <img 
                    src={user?.avatar || 'https://via.placeholder.com/40'} 
                    className="w-8 h-8 rounded-full" 
                    alt="avatar"
                  />
                  <div>
                    <p className="text-white font-medium">{user?.name || ''}</p>
                    <p className="text-gray-400 text-xs capitalize">{user?.role || ''}</p>
                  </div>
               </div>

               <button 
                onClick={() => {
                  toggleTheme();
                  setIsMobileMenuOpen(false);
                }}
                className="flex w-full items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg"
              >
                 {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                 <span>{theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}</span>
              </button>
               <button 
                onClick={handleLogout}
                className="flex w-full items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg mt-2"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
             </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0 relative w-full bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
        {children}
      </main>
    </div>
  );
};