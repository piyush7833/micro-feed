'use client';

import { useState } from 'react';
import { Heart, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { PostWithProfile } from '@/types/post';
import { useLike } from '@/hooks/useLike';
import { useMutatePost } from '@/hooks/useMutatePost';
import { Composer } from '@/components/Composer';


interface PostCardProps {
  post: PostWithProfile;
  currentUserId?: string;
  onPostUpdate?: (postId: string, newContent: string) => void;
  onPostDelete?: (postId: string) => void;
  onRevertUpdate?: (postId: string) => void;
  onRevertDelete?: (postId: string, post: PostWithProfile) => void;
  optimisticUpdates?: any;
}

export function PostCard({ post, currentUserId, onPostUpdate, onPostDelete, onRevertUpdate, onRevertDelete, optimisticUpdates }: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const { toggleLikeMutation, getOptimisticState } = useLike();
  const { deletePostMutation } = useMutatePost();
  
  const { isLiked, likesCount } = getOptimisticState(post);
  const isOwnPost = currentUserId === post.author_id;
  
  const handleLike = async () => {
    await toggleLikeMutation(post.id, post);
  };
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      // Optimistically remove from UI immediately
      if (onPostDelete) {
        onPostDelete(post.id);
      }
      
      try {
        await deletePostMutation.mutate(post.id);
        // Success - optimistic state will be cleaned up automatically
      } catch (error) {
        console.error('Error deleting post:', error);
        // Revert the optimistic delete
        if (onRevertDelete) {
          onRevertDelete(post.id, post);
        }
        alert('Failed to delete post. Please try again.');
      }
    }
  };
  
  const handleEditComplete = (newContent?: string) => {
    setIsEditing(false);
    // Update the post optimistically without triggering a full refresh
    if (newContent && onPostUpdate) {
      onPostUpdate(post.id, newContent);
    }
  };
  
  const handleEditCancel = () => {
    setIsEditing(false);
  };
  
  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <Composer
          mode="edit"
          initialContent={post.content}
          postId={post.id}
          onComplete={handleEditComplete}
          onCancel={handleEditCancel}
          onRevertUpdate={() => {
            onRevertUpdate?.(post.id);
            setIsEditing(false);
          }}
        />
      </div>
    );
  }
  
  const isOptimistic = post.id.startsWith('temp-');
  // Check if this post has been published (no longer showing "Publishing...")
  const isPublished = optimisticUpdates?.published?.has(post.id) || false;
  const isPublishing = isOptimistic && !isPublished;

  return (
    <article className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow ${isOptimistic ? 'opacity-75 border-blue-200' : ''}`}>
      <div className="p-4">
        {isPublishing && (
          <div className="mb-2 flex items-center text-xs text-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2"></div>
            Publishing...
          </div>
        )}
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {post.profiles.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">@{post.profiles.username}</p>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                {post.updated_at !== post.created_at && (
                  <span className="ml-1 text-xs">(edited)</span>
                )}
              </p>
            </div>
          </div>
          
          {/* Menu for own posts */}
          {isOwnPost && !isOptimistic && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      handleDelete();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    disabled={deletePostMutation.loading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deletePostMutation.loading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="mb-4">
          {post.content.includes('<') && post.content.includes('>') ? (
            <div 
              className="text-gray-900 prose prose-sm max-w-none
                [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:my-2
                [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:my-2  
                [&_h3]:text-base [&_h3]:font-semibold [&_h3]:my-1
                [&_strong]:font-semibold
                [&_em]:italic
                [&_u]:underline
                [&_s]:line-through
                [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2
                [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2
                [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:bg-gray-50 [&_blockquote]:py-2 [&_blockquote]:rounded-r
                [&_code]:bg-gray-100 [&_code]:text-gray-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
                [&_pre]:bg-gray-800 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:my-4
                [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0
                [&_a]:text-blue-500 [&_a]:no-underline [&_a:hover]:underline
                [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <p className="text-gray-900 whitespace-pre-wrap break-words">
              {post.content}
            </p>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <button
            onClick={handleLike}
            disabled={!currentUserId || isPublishing}
            className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-colors ${
              isLiked
                ? 'text-red-500 bg-red-50 hover:bg-red-100'
                : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
            } ${(!currentUserId || isPublishing) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Heart
              className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`}
            />
            <span className="text-sm font-medium">
              {likesCount > 0 && likesCount}
            </span>
          </button>
          
          <div className="text-xs text-gray-400">
            {post.content.includes('<') && post.content.includes('>') 
              ? `${post.content.replace(/<[^>]*>/g, '').length}/500`
              : `${post.content.length}/500`
            }
          </div>
        </div>
      </div>
      
      {/* Close menu when clicking outside */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </article>
  );
}

// Helper function to format dates (you might want to install date-fns for this)
function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m${options?.addSuffix ? ' ago' : ''}`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h${options?.addSuffix ? ' ago' : ''}`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d${options?.addSuffix ? ' ago' : ''}`;
  
  return date.toLocaleDateString();
}
