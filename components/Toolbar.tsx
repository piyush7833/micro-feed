'use client';

import { Loader2 } from 'lucide-react';
import { PostFilter } from '@/types/post';

interface ToolbarProps {
  filter: PostFilter;
  onFilterChange: (filter: PostFilter) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  className?: string;
  isAuthenticated?: boolean;
  loading?: boolean;
}

export function Toolbar({ 
  filter, 
  onFilterChange, 
  searchValue, 
  onSearchChange,
  className = "",
  isAuthenticated = false,
  loading = false,
}: ToolbarProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Filter tabs */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onFilterChange('all')}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
              filter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>All Posts</span>
              {loading && filter === 'all' && <Loader2 className="w-3 h-3 animate-spin" />}
            </div>
          </button>
          {isAuthenticated ? (
            <button
              onClick={() => onFilterChange('mine')}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
                filter === 'mine'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>My Posts</span>
                {loading && filter === 'mine' && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>
            </button>
          ) : (
            <button
              disabled
              className="px-4 py-2 text-sm font-medium rounded-md text-gray-400 cursor-not-allowed"
              title="Sign in to view your posts"
            >
              My Posts
            </button>
          )}
        </div>
        
        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
          />
        </div>
      </div>
    </div>
  );
}
