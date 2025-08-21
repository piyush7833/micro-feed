'use client';

import { useState, useTransition } from 'react';
import { LogOut, User } from 'lucide-react';
import { signOut } from '@/app/actions/auth';

interface HeaderProps {
  user?: {
    id: string;
    email?: string;
    profile?: {
      username: string;
    };
  } | null;
  onSignInClick: () => void;
}

export function Header({ user, onSignInClick }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  const handleSignOut = () => {
    startTransition(async () => {
      try {
        const result = await signOut();
        if (result.success) {
          // Refresh page to update user state
          window.location.reload();
        } else {
          console.error('Error signing out:', result.error);
        }
      } catch (error) {
        console.error('Error signing out:', error);
      }
    });
  };
  
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Micro Feed
          </h1>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user.profile?.username.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    @{user.profile?.username || 'user'}
                  </span>
                </button>
                
                {showUserMenu && (
                  <>
                    <div className="absolute right-0 top-12 bg-white border rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
                      <div className="px-3 py-2 text-sm text-gray-500 border-b">
                        {user.email}
                      </div>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setShowUserMenu(false);
                        }}
                        disabled={isPending}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {isPending ? 'Signing out...' : 'Sign out'}
                      </button>
                    </div>
                    
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onSignInClick}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
