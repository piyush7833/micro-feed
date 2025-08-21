'use client';

import { useState } from 'react';
import { Send, X } from 'lucide-react';
import { useMutatePost } from '@/hooks/useMutatePost';
import { createPostSchema, updatePostSchema } from '@/lib/validators';

interface ComposerProps {
  mode?: 'create' | 'edit';
  initialContent?: string;
  postId?: string;
  onComplete?: (newContent?: string) => void;
  onCancel?: () => void;
  onRevertUpdate?: () => void;
  onOptimisticSuccess?: (realPost?: any) => void;
  placeholder?: string;
  onOptimisticCreate?: (content: string) => void;
}

export function Composer({
  mode = 'create',
  initialContent = '',
  postId,
  onComplete,
  onCancel,
  onRevertUpdate,
  onOptimisticSuccess,
  placeholder = "What's on your mind?",
  onOptimisticCreate,
}: ComposerProps) {
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  
  const { createPostMutation, updatePostMutation } = useMutatePost();
  
  const isLoading = mode === 'create' 
    ? createPostMutation.loading 
    : updatePostMutation.loading;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      // Validate content
      const schema = mode === 'create' ? createPostSchema : updatePostSchema;
      const validatedData = schema.parse({ content });
      
      if (mode === 'create') {
        // Add optimistic update immediately
        if (onOptimisticCreate) {
          onOptimisticCreate(validatedData.content);
          setContent(''); // Clear content immediately for better UX
        }
        
        try {
          const createdPost = await createPostMutation.mutate(validatedData);
          // Server creation succeeded - update optimistic post with real ID
          onOptimisticSuccess?.(createdPost);
        } catch (error) {
          // If creation fails, restore the content so user can retry
          if (onOptimisticCreate) {
            setContent(validatedData.content);
          }
          throw error; // Re-throw to show error message
        }
      } else if (mode === 'edit' && postId) {
        // Update optimistically - call onComplete immediately with new content
        onComplete?.(validatedData.content);
        
        // Then update on server in background
        try {
          await updatePostMutation.mutate(postId, validatedData);
          // Server update succeeded - optimistic state will be cleaned up automatically  
        } catch (error) {
          console.error('Failed to update on server:', error);
          setError('Failed to save changes. Please try again.');
          // Revert the optimistic update
          if (onRevertUpdate) {
            onRevertUpdate();
          }
        }
      }
    } catch (error: any) {
      if (error?.errors) {
        // Zod validation error
        setError(error.errors[0]?.message || 'Validation error');
      } else {
        setError(error instanceof Error ? error.message : 'An error occurred');
      }
    }
  };
  
  const handleCancel = () => {
    setContent(initialContent);
    setError(null);
    onCancel?.();
  };
  
  const remainingChars = 280 - content.length;
  const isOverLimit = remainingChars < 0;
  const isEmpty = content.trim().length === 0;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={mode === 'edit' ? 3 : 4}
          className={`w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            isOverLimit ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          disabled={isLoading}
        />
        
        {/* Character count */}
        <div className={`absolute bottom-3 right-3 text-xs ${
          isOverLimit ? 'text-red-500' : remainingChars < 20 ? 'text-yellow-500' : 'text-gray-400'
        }`}>
          {remainingChars}
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {mode === 'create' ? 'Share your thoughts' : 'Edit your post'}
        </div>
        
        <div className="flex items-center space-x-2">
          {mode === 'edit' && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4 mr-1 inline" />
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={isLoading || isEmpty || isOverLimit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>
              {isLoading 
                ? (mode === 'create' ? 'Posting...' : 'Updating...')
                : (mode === 'create' ? 'Post' : 'Update')
              }
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}
