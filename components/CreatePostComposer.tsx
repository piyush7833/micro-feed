'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { useMutatePost } from '@/hooks/useMutatePost';
import { RichTextEditor } from './RichTextEditor';
import { APP_CONFIG } from '@/lib/constants';

interface CreatePostComposerProps {
  onComplete?: (newContent?: string) => void;
  onOptimisticCreate?: (content: string) => string; // Return temp ID
  onOptimisticSuccess?: (tempId: string, realPost: any) => void;
  placeholder?: string;
  className?: string;
}

export function CreatePostComposer({
  onComplete,
  onOptimisticCreate,
  onOptimisticSuccess,
  placeholder = "What's on your mind?",
  className = ''
}: CreatePostComposerProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { createPostMutation } = useMutatePost();

  const getTextContent = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const getCharacterCount = () => {
    return getTextContent(content).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      // Validate text content length but send HTML content
      const textContent = getTextContent(content);
      
      // Manual validation for text content length
      if (!textContent.trim()) {
        throw new Error('Post content cannot be empty');
      }
      if (textContent.length > APP_CONFIG.MAX_POST_LENGTH) {
        throw new Error(`Post text content must be ${APP_CONFIG.MAX_POST_LENGTH} characters or less`);
      }
      
      const actualContent = content; // Use the HTML content
      
      // Add optimistic update immediately and get temp ID
      let tempId: string | undefined;
      if (onOptimisticCreate) {
        tempId = onOptimisticCreate(actualContent);
      }

      // Create post with server action
      const realPost = await createPostMutation.mutate({ content: actualContent });
      
      // Replace temp post with real post data
      if (tempId && realPost && onOptimisticSuccess) {
        onOptimisticSuccess(tempId, realPost);
      }
      
      // Reset form on success
      setContent('');
      onComplete?.(actualContent);
      
    } catch (error: any) {
      console.error('Error creating post:', error);
      setError(error.message || 'Failed to create post');
    }
  };

  const characterCount = getCharacterCount();
  const isValid = characterCount > 0 && characterCount <= APP_CONFIG.MAX_POST_LENGTH;
  const isSubmitting = createPostMutation.loading;

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder={placeholder}
          disabled={isSubmitting}
        />
        
        {/* Character Counter */}
        <div className="flex justify-between items-center text-sm">
          <div>
            {error && (
              <span className="text-red-600">{error}</span>
            )}
          </div>
          <span className={`${
            characterCount > APP_CONFIG.MAX_POST_LENGTH 
              ? 'text-red-600 font-medium' 
              : characterCount > APP_CONFIG.MAX_POST_LENGTH * 0.8
              ? 'text-yellow-600'
              : 'text-gray-500'
          }`}>
            {characterCount}/{APP_CONFIG.MAX_POST_LENGTH}
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={16} />
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
}
