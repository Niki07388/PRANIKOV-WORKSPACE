
import React, { useEffect, useState, useRef } from 'react';
import { Project, Checkpoint, Task, UserRole, MessageType, ChatMessage, TaskStatus, CheckpointStatus } from '../types';
import { MockBackend } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  CheckSquare, 
  Plus, 
  MessageSquare, 
  Paperclip, 
  Mic, 
  Image as ImageIcon, 
  Send,
  MoreVertical,
  FileText,
  CheckCircle2,
  Circle,
  Trash2,
  ListTodo,
  X,
  LayoutList
} from 'lucide-react';

// --- Sub-Components ---

// 1. Checkpoint/Task Manager Component
const ProjectManager: React.FC<{ 
  project: Project; 
  canEdit: boolean; 
  onUpdate: (p: Project) => void 
}> = ({ project, canEdit, onUpdate }) => {
  const { showNotification } = useAuth();
  const [isAddingCheckpoint, setIsAddingCheckpoint] = useState(false);
  const [newCpTitle, setNewCpTitle] = useState('');
  const [newCpDesc, setNewCpDesc] = useState('');
  
  // Track which checkpoint is currently adding a task
  const [addingTaskForCpId, setAddingTaskForCpId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleTaskToggle = async (cpId: string, taskId: string, currentStatus: TaskStatus) => {
    if (!canEdit) return;
    const newStatus = currentStatus === TaskStatus.PENDING ? TaskStatus.COMPLETED : TaskStatus.PENDING;
    const updatedCheckpoints = project.checkpoints.map(cp => {
      if (cp.id !== cpId) return cp;
      const updatedTasks = cp.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
      return { ...cp, tasks: updatedTasks };
    });
    
    // Optimistic update
    onUpdate({ ...project, checkpoints: updatedCheckpoints });
    
    await MockBackend.updateProjectCheckpoint(project.id, updatedCheckpoints);
    
    if (newStatus === TaskStatus.COMPLETED) {
        // Subtle sound or feedback could go here
    }
  };

  const handleAddCheckpoint = async () => {
    if (!newCpTitle.trim()) {
        showNotification('Checkpoint title is required', 'error');
        return;
    }
    const newCp: Checkpoint = {
      id: `cp-${Date.now()}`,
      title: newCpTitle,
      description: newCpDesc,
      deadline: new Date().toISOString(),
      status: CheckpointStatus.PENDING,
      tasks: []
    };
    const updatedCheckpoints = [...project.checkpoints, newCp];
    
    await MockBackend.updateProjectCheckpoint(project.id, updatedCheckpoints);
    onUpdate({ ...project, checkpoints: updatedCheckpoints });
    
    setIsAddingCheckpoint(false);
    setNewCpTitle('');
    setNewCpDesc('');
    showNotification('Checkpoint added', 'success');
  };

  const submitNewTask = async (cpId: string) => {
    if (!newTaskTitle.trim()) {
        setAddingTaskForCpId(null);
        setNewTaskTitle('');
        return;
    }
    
    const newTask: Task = {
      id: `t-${Date.now()}`,
      title: newTaskTitle.trim(),
      status: TaskStatus.PENDING
    };

    const updatedCheckpoints = project.checkpoints.map(cp => {
        if (cp.id === cpId) {
            return { ...cp, tasks: [...cp.tasks, newTask] };
        }
        return cp;
    });

    await MockBackend.updateProjectCheckpoint(project.id, updatedCheckpoints);
    onUpdate({ ...project, checkpoints: updatedCheckpoints });
    
    setAddingTaskForCpId(null);
    setNewTaskTitle('');
    showNotification('Task added', 'success');
  };

  const handleDeleteCheckpoint = async (cpId: string) => {
    if (!window.confirm("Delete this checkpoint and all its tasks?")) return;
    const updatedCheckpoints = project.checkpoints.filter(cp => cp.id !== cpId);
    await MockBackend.updateProjectCheckpoint(project.id, updatedCheckpoints);
    onUpdate({ ...project, checkpoints: updatedCheckpoints });
    showNotification('Checkpoint removed', 'info');
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-colors">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{project.projectName}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{project.description}</p>
          </div>
          <div className="text-right min-w-[80px]">
             <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Progress</div>
             <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{project.progress}%</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900 space-y-6 transition-colors pb-32">
        {project.checkpoints.length === 0 && !isAddingCheckpoint && (
            <div className="text-center text-gray-400 py-10 flex flex-col items-center">
                <LayoutList size={48} className="mb-3 opacity-20" />
                <p>No checkpoints created.</p>
                {canEdit && <p className="text-sm mt-2">Click the button below to start.</p>}
            </div>
        )}
        
        {project.checkpoints.map(cp => (
          <div key={cp.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/30">
              <div className="flex-1">
                <h3 className={`font-semibold flex items-center ${cp.status === CheckpointStatus.COMPLETED ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                   {cp.status === CheckpointStatus.COMPLETED ? (
                       <CheckCircle2 size={18} className="mr-2" />
                   ) : (
                       <Circle size={18} className="text-gray-400 dark:text-gray-500 mr-2" />
                   )}
                   {cp.title}
                </h3>
                {cp.description && <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-0.5">{cp.description}</p>}
              </div>
              {canEdit && (
                  <div className="flex items-center space-x-2 ml-2">
                    <button 
                        onClick={() => setAddingTaskForCpId(cp.id)} 
                        className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded transition-colors" 
                        title="Add Task"
                    >
                        <Plus size={16} />
                    </button>
                    <button 
                        onClick={() => handleDeleteCheckpoint(cp.id)} 
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 rounded transition-colors" 
                        title="Delete Checkpoint"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
              )}
            </div>
            
            <div className="p-2">
               {cp.tasks.length === 0 && !addingTaskForCpId && (
                   <div className="text-xs text-gray-400 p-2 text-center italic">No tasks added yet</div>
               )}
               
               {cp.tasks.map(task => (
                 <div 
                    key={task.id} 
                    className={`flex items-center p-3 rounded-lg group transition-colors ${canEdit ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer' : ''}`} 
                    onClick={() => canEdit && handleTaskToggle(cp.id, task.id, task.status)}
                 >
                   <button 
                    className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${
                        task.status === TaskStatus.COMPLETED 
                        ? 'bg-indigo-500 border-indigo-500 text-white' 
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-transparent group-hover:border-indigo-400'
                    }`}
                   >
                     <CheckSquare size={14} />
                   </button>
                   <span className={`text-sm select-none ${task.status === TaskStatus.COMPLETED ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                     {task.title}
                   </span>
                 </div>
               ))}

               {/* Inline Add Task Input */}
               {addingTaskForCpId === cp.id && (
                   <div className="flex items-center p-3 animate-in fade-in slide-in-from-top-1 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-lg">
                       <div className="w-5 h-5 mr-3 flex items-center justify-center">
                           <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                       </div>
                       <input 
                           autoFocus
                           type="text"
                           className="flex-1 bg-transparent border-b border-indigo-200 dark:border-indigo-700 px-2 py-1 text-sm focus:border-indigo-500 outline-none dark:text-white placeholder-indigo-300"
                           placeholder="Type task name & press Enter..."
                           value={newTaskTitle}
                           onChange={e => setNewTaskTitle(e.target.value)}
                           onKeyDown={e => {
                               if (e.key === 'Enter') submitNewTask(cp.id);
                               if (e.key === 'Escape') {
                                   setAddingTaskForCpId(null);
                                   setNewTaskTitle('');
                               }
                           }}
                       />
                       <button onClick={() => { setAddingTaskForCpId(null); setNewTaskTitle(''); }} className="ml-2 text-gray-400 hover:text-gray-600">
                           <X size={16}/>
                       </button>
                   </div>
               )}
            </div>
          </div>
        ))}
        
        {canEdit && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-4 transition-colors hover:border-indigo-300 dark:hover:border-indigo-600">
                {!isAddingCheckpoint ? (
                    <button 
                        onClick={() => setIsAddingCheckpoint(true)}
                        className="w-full flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 py-2 transition-colors"
                    >
                        <Plus size={20} />
                        <span className="font-medium">Add New Checkpoint</span>
                    </button>
                ) : (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center"><ListTodo size={16} className="mr-2"/>New Checkpoint Details</h4>
                        <input 
                            autoFocus
                            placeholder="Checkpoint Title (e.g. Backend Setup)" 
                            className="w-full p-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            value={newCpTitle}
                            onChange={e => setNewCpTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddCheckpoint()}
                        />
                         <input 
                            placeholder="Description (Optional)" 
                            className="w-full p-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            value={newCpDesc}
                            onChange={e => setNewCpDesc(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddCheckpoint()}
                        />
                        <div className="flex justify-end space-x-3 pt-2">
                             <button onClick={() => setIsAddingCheckpoint(false)} className="text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors">Cancel</button>
                             <button onClick={handleAddCheckpoint} className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm">Create Checkpoint</button>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

// 2. Chat Component
const ProjectChat: React.FC<{ projectId: string; currentUserId: string }> = ({ projectId, currentUserId }) => {
  const { showNotification } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const loadMessages = async () => {
      const msgs = await MockBackend.getMessages(projectId);
      // Only update if different (simple length check for optimization in mock)
      setMessages(msgs);
    };
    loadMessages();
    // Poll for new messages every 2 seconds
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [projectId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (type: MessageType = MessageType.TEXT, content: string = newMessage, fileName?: string) => {
    const textToSend = content.trim();
    if (!textToSend && type === MessageType.TEXT) return;

    const user = await MockBackend.getCurrentUser();
    if (!user) return;

    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      projectId,
      senderId: user.id,
      senderName: user.name,
      type,
      content: type === MessageType.TEXT ? textToSend : content,
      timestamp: Date.now(),
      fileName
    };

    await MockBackend.sendMessage(msg);
    setMessages(prev => [...prev, msg]); // Optimistic update
    setNewMessage('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const type = file.type.startsWith('image/') ? MessageType.IMAGE : MessageType.FILE;
      handleSend(type, base64, file.name);
      showNotification('File uploaded', 'success');
    };
    reader.readAsDataURL(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMicClick = () => {
     if (!isRecording) {
         setIsRecording(true);
         showNotification('Recording... Click again to send', 'info');
     } else {
         setIsRecording(false);
         // Simulating a recorded audio file
         handleSend(MessageType.AUDIO, 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav'); 
         showNotification('Audio sent', 'success');
     }
  };

  return (
    <div className="h-full flex flex-col bg-[#efe7dd] dark:bg-gray-900 relative transition-colors"> 
      <div className="absolute inset-0 opacity-5 pointer-events-none dark:opacity-[0.02] dark:invert" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}></div>

      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10 shadow-sm flex justify-between items-center transition-colors">
        <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
                <MessageSquare size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Team Chat</h3>
                <p className="text-xs text-green-500 font-medium flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> Live</p>
            </div>
        </div>
        <MoreVertical size={20} className="text-gray-400 cursor-pointer hover:text-gray-600" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 z-10 scrollbar-hide">
        {messages.length === 0 && (
            <div className="text-center mt-10 text-gray-500 text-xs bg-white/80 dark:bg-black/40 p-3 rounded-lg mx-auto max-w-xs backdrop-blur-sm shadow-sm">
                No messages yet. Say hi to the team!
            </div>
        )}
        {messages.map(msg => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[80%] md:max-w-[65%] rounded-2xl px-4 py-2 shadow-sm relative text-sm ${
                  isMe 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none'
                }`}>
                 {!isMe && <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 mb-1 uppercase tracking-wider">{msg.senderName}</p>}
                 
                 {msg.type === MessageType.TEXT && <p className="whitespace-pre-wrap">{msg.content}</p>}
                 {msg.type === MessageType.IMAGE && (
                     <img src={msg.content} alt="Attachment" className="max-w-full rounded-lg max-h-60 object-cover mt-1 border-2 border-white/20" />
                 )}
                 {msg.type === MessageType.FILE && (
                     <a href={msg.content} download={msg.fileName} className={`flex items-center space-x-3 p-3 rounded-lg bg-opacity-10 mt-1 border ${isMe ? 'bg-black border-white/10' : 'bg-gray-500 border-gray-200 dark:border-gray-700'}`}>
                         <div className="bg-white p-1 rounded">
                            <FileText size={20} className="text-indigo-600" />
                         </div>
                         <span className="underline truncate max-w-[150px] font-medium">{msg.fileName || 'Document'}</span>
                     </a>
                 )}
                 {msg.type === MessageType.AUDIO && (
                     <div className="flex items-center space-x-2 mt-1 min-w-[200px]">
                         <div className="p-2 bg-white/20 rounded-full">
                            <Mic size={16} />
                         </div>
                         <audio controls src={msg.content} className="h-8 w-full max-w-[200px] rounded" />
                     </div>
                 )}

                 <p className={`text-[10px] text-right mt-1 opacity-70`}>
                     {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </p>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <div className="p-3 bg-gray-100 dark:bg-gray-800 z-10 transition-colors pb-safe">
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-700 rounded-full px-2 py-2 shadow-sm transition-colors border border-gray-200 dark:border-gray-600">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors" title="Attach File">
                <Paperclip size={20} />
            </button>
            <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                onChange={handleFileUpload} 
            />
             <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors hidden sm:block" title="Upload Image">
                <ImageIcon size={20} />
            </button>
            
            <input 
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 border-none focus:ring-0 outline-none text-sm bg-transparent dark:text-white dark:placeholder-gray-400 min-w-0 px-2"
            />

            {newMessage.trim() ? (
                <button onClick={() => handleSend()} className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors shadow-md transform active:scale-95">
                    <Send size={18} />
                </button>
            ) : (
                <button onClick={handleMicClick} className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-red-500/50 shadow-lg' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`} title="Record Audio">
                    <Mic size={20} />
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export const ProjectDetails: React.FC = () => {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState<'details' | 'chat'>('details');

  // Hash parsing to get ID
  const projectId = window.location.hash.split('/')[2];

  useEffect(() => {
    const load = async () => {
      if (projectId) {
        const p = await MockBackend.getProjectById(projectId);
        setProject(p || null);
      }
      setLoading(false);
    };
    
    load();
    // Poll for project updates (Real-time simulation)
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [projectId]);

  if (loading) return <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600"></div></div>;
  if (!project) return <div className="p-10 text-center text-gray-500 dark:text-gray-400">Project not found</div>;

  const canEdit = user?.role === UserRole.MANAGER;

  return (
    <div className="h-full flex flex-col relative">
        
      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button 
            onClick={() => setActiveMobileTab('details')}
            className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeMobileTab === 'details' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
          >
              Project Details
          </button>
          <button 
            onClick={() => setActiveMobileTab('chat')}
            className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeMobileTab === 'chat' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
          >
              Team Chat
          </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Manager View */}
        <div className={`w-full md:w-1/2 lg:w-3/5 h-full overflow-hidden ${activeMobileTab === 'chat' ? 'hidden md:block' : 'block'}`}>
            <ProjectManager project={project} canEdit={canEdit} onUpdate={setProject} />
        </div>

        {/* Right: Chat View */}
        <div className={`w-full md:w-1/2 lg:w-2/5 h-full border-l border-gray-200 dark:border-gray-700 overflow-hidden ${activeMobileTab === 'details' ? 'hidden md:flex' : 'flex'} flex-col`}>
            <ProjectChat projectId={project.id} currentUserId={user?.id || ''} />
        </div>
      </div>
    </div>
  );
};
