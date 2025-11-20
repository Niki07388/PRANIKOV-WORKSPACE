export enum UserRole {
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  password?: string; // Added for registration flow
}

export enum TaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignedTo?: string; // User ID
}

export enum CheckpointStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

export interface Checkpoint {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO Date string
  status: CheckpointStatus;
  tasks: Task[];
}

export interface Project {
  id: string;
  projectName: string;
  description: string;
  createdBy: string; // Manager ID
  deadline: string;
  assignedUserIds: string[];
  checkpoints: Checkpoint[];
  progress: number; // 0-100
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
}

export interface ChatMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  content: string; // Text or Base64 URL
  timestamp: number;
  fileName?: string; // For files
}