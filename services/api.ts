import { User, UserRole, Project, ChatMessage, Checkpoint, MessageType } from '../types';

// --- Constants & Keys ---
const KEYS = {
  PROJECTS: 'pranikov_projects',
  MESSAGES: 'pranikov_messages',
  CURRENT_USER: 'pranikov_current_user',
  TOKEN: 'pranikov_token',
};

// --- Helper to simulate network latency (kept for occasional UI pacing) ---
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- API client ---
const apiFetch = async (path: string, options: RequestInit = {}) => {
  // Default to local Flask backend when VITE_API_BASE isn't configured in env
  const base = ((import.meta as any).env && (import.meta as any).env.VITE_API_BASE) ? (import.meta as any).env.VITE_API_BASE : 'http://127.0.0.1:5000';
  const token = localStorage.getItem(KEYS.TOKEN);
  const defaultHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) defaultHeaders['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    headers: { ...defaultHeaders, ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || res.statusText);
  }
  return res.json().catch(() => ({}));
};

const apiImpl = {
  register: async (userData: Omit<User, 'id'>): Promise<User> => {
    const res = await apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) }) as any;
    if (res && res.accessToken) {
      localStorage.setItem(KEYS.TOKEN, res.accessToken);
    }
    return res.user as User;
  },

  login: async (email: string, password?: string): Promise<User | null> => {
    const body = { email, password };
    const res = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }) as any;
    if (res && res.accessToken) {
      localStorage.setItem(KEYS.TOKEN, res.accessToken);
    }
    return res.user as User;
  },

  logout: () => {
    localStorage.removeItem(KEYS.TOKEN);
    localStorage.removeItem(KEYS.CURRENT_USER);
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const user = await apiFetch('/api/auth/me');
      return user as User;
    } catch (e) {
      return null;
    }
  },

  getUsers: async (): Promise<User[]> => {
    return apiFetch('/api/users');
  },

  getProjects: async (userId: string, role: UserRole): Promise<Project[]> => {
    const qs = new URLSearchParams({ userId: userId || '', role: role || '' });
    return apiFetch(`/api/projects?${qs.toString()}`);
  },

  getProjectById: async (projectId: string): Promise<Project | undefined> => {
    return apiFetch(`/api/projects/${projectId}`);
  },

  createProject: async (project: Project): Promise<void> => {
    await apiFetch('/api/projects', { method: 'POST', body: JSON.stringify(project) });
  },

  updateProjectCheckpoint: async (projectId: string, checkpoints: Checkpoint[]): Promise<void> => {
    await apiFetch(`/api/projects/${projectId}/checkpoints`, { method: 'PUT', body: JSON.stringify({ checkpoints }) });
  },

  getMessages: async (projectId: string): Promise<ChatMessage[]> => {
    return apiFetch(`/api/projects/${projectId}/messages`);
  },

  sendMessage: async (message: ChatMessage): Promise<void> => {
    await apiFetch(`/api/projects/${message.projectId}/messages`, { method: 'POST', body: JSON.stringify(message) });
  }
};

export const MockBackend = apiImpl;

export default apiImpl;
