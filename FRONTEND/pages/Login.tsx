
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Briefcase, UserPlus, LogIn } from 'lucide-react';
import { UserRole } from '../types';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.EMPLOYEE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (isRegistering) {
      if (!name || !email || !password) {
        setIsSubmitting(false);
        return; 
      }
      const success = await register(name, email, role, password);
      if (success) {
        window.location.hash = '#/dashboard';
      }
    } else {
      const success = await login(email, password);
      if (success) {
        window.location.hash = '#/dashboard';
      }
    }
    setIsSubmitting(false);
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center px-4 dark:bg-black transition-colors duration-200">
      <div className="max-w-md w-full bg-gray-800 dark:bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <div className="bg-indigo-600 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
            <Briefcase className="text-white w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">COSMOVEXA DEV</h1>
          <p className="text-gray-400 mt-2">Project Tracking Workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-900 dark:bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="John Doe"
                  required={isRegistering}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        type="button"
                        onClick={() => setRole(UserRole.EMPLOYEE)}
                        className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${role === UserRole.EMPLOYEE ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                    >
                        Employee
                    </button>
                    <button 
                        type="button"
                        onClick={() => setRole(UserRole.MANAGER)}
                        className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${role === UserRole.MANAGER ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                    >
                        Manager
                    </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 dark:bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="name@company.com"
              required
            />
          </div>

           <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 dark:bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <span className="opacity-80">Processing...</span>
            ) : (
              <>
                {isRegistering ? <UserPlus size={20} /> : <LogIn size={20} />}
                <span>{isRegistering ? 'Create Account' : 'Sign In'}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-700 text-center">
          <button 
            onClick={toggleMode}
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors hover:underline text-sm"
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
          </button>
        </div>
        
        {!isRegistering && (
          <div className="mt-6 bg-gray-900/50 p-3 rounded text-center border border-gray-700/50">
             <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2 font-bold">Quick Demo Access</p>
             <div className="grid grid-cols-2 gap-2">
                <div className="text-left">
                    <p className="text-xs text-indigo-400 font-semibold">Manager</p>
                    <p className="text-[10px] text-gray-400 font-mono">manager@pranikov.com</p>
                    <p className="text-[10px] text-gray-500 font-mono">pass: 123</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-emerald-400 font-semibold">Employee</p>
                    <p className="text-[10px] text-gray-400 font-mono">sarah@pranikov.com</p>
                    <p className="text-[10px] text-gray-500 font-mono">pass: 123</p>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
