import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { MockBackend } from '../services/api';

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
  id: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, role: any, password?: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  notifications: Notification[];
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeNotification: (id: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const initAuth = async () => {
        // Remove any legacy mock-client stored user or token to avoid accidental auto-login
        try {
          localStorage.removeItem('pranikov_current_user');
          localStorage.removeItem('pranikov_token');
        } catch {}

        const currentUser = await MockBackend.getCurrentUser();
        setUser(currentUser);
        
        // Check local storage for theme preference
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
        if (savedTheme) {
          setTheme(savedTheme);
          document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setTheme('dark');
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
    
        setLoading(false);
    };
    initAuth();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { message, type, id }]);
    // Auto remove after 3 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 3000);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const login = async (email: string, password?: string) => {
    const loggedInUser = await MockBackend.login(email, password);
    if (loggedInUser) {
      setUser(loggedInUser);
      showNotification(`Welcome back, ${loggedInUser.name}!`, 'success');
      return true;
    }
    showNotification('Invalid email or password', 'error');
    return false;
  };

  const register = async (name: string, email: string, role: any, password?: string) => {
    try {
      const newUser = await MockBackend.register({ name, email, role, password });
      setUser(newUser);
      showNotification('Account created successfully!', 'success');
      return true;
    } catch (e: any) {
      console.error(e);
      showNotification(e.message || 'Registration failed', 'error');
      return false;
    }
  };

  const logout = () => {
    MockBackend.logout();
    setUser(null);
    showNotification('Logged out successfully', 'info');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      loading, 
      theme, 
      toggleTheme,
      notifications,
      showNotification,
      removeNotification
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};