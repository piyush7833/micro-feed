'use client';

import { useState, useTransition } from 'react';
import { X, Mail, Lock, User } from 'lucide-react';
import { signIn, signUp } from '@/app/actions/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setFieldError(null);
    
    startTransition(async () => {
      try {
        if (mode === 'signin') {
          const result = await signIn({ email, password });
          
          if (result.success) {
            // Close modal and trigger success handler
            onClose();
            // Trigger page refresh to update user state
            window.location.reload();
          } else {
            setError(result.error);
          }
        } else {
          const result = await signUp({ email, password, username });
          
          if (result.success) {
            if (result.message) {
              // Show success message for email confirmation
              setMessage(result.message);
            } else {
              // Immediate success - close modal and refresh
              onClose();
              window.location.reload();
            }
          } else {
            setError(result.error);
            if (result.field) {
              setFieldError(result.field);
            }
          }
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Authentication failed');
      }
    });
  };
  
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setError(null);
    setMessage(null);
    setFieldError(null);
  };
  
  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    resetForm();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    fieldError === 'username' ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter username"
                  required
                  disabled={isPending}
                />
              </div>
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email"
                required
                disabled={isPending}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
                required
                disabled={isPending}
                minLength={6}
              />
            </div>
          </div>
          
          {message && (
            <div className="space-y-3">
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200 whitespace-pre-line">
                {message}
              </div>
              <button
                type="button"
                onClick={() => {
                  // Open default email client
                  window.location.href = 'mailto:';
                }}
                className="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Open Email App
              </button>
            </div>
          )}
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending 
              ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
              : (mode === 'signin' ? 'Sign In' : 'Create Account')
            }
          </button>
        </form>
        
        <div className="px-6 pb-6">
          <p className="text-center text-sm text-gray-600">
            {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={switchMode}
              disabled={isPending}
              className="text-blue-500 hover:text-blue-600 font-medium disabled:opacity-50"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
