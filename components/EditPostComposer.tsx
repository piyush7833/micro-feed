'use client';

import { useState } from 'react';
import { Send, X } from 'lucide-react';
import { useMutatePost } from '@/hooks/useMutatePost';
import { RichTextEditor } from './RichTextEditor';
import { APP_CONFIG } from '@/lib/constants';

interface EditPostComposerProps {
  postId: string;
  initialContent: string;
  onComplete?: (newContent?: string) => void;
  onCancel?: () => void;
  className?: string;
}

export function EditPostComposer({
  postId,
  initialContent,
  onComplete,
  onCancel,
  className = ''
}: EditPostComposerProps) {
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const { updatePostMutation } = useMutatePost();

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

      // Update post with server action
      await updatePostMutation.mutate(postId, { content: actualContent });
      
      onComplete?.(actualContent);
      
    } catch (error: any) {
      console.error('Error updating post:', error);
      setError(error.message || 'Failed to update post');
    }
  };

  const characterCount = getCharacterCount();
  const isValid = characterCount > 0 && characterCount <= APP_CONFIG.MAX_POST_LENGTH;
  const isSubmitting = updatePostMutation.loading;

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Edit your post..."
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

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          <Send size={14} />
          {isSubmitting ? 'Updating...' : 'Update'}
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
        >
          <X size={14} />
          Cancel
        </button>
      </div>
    </form>
  );
}
