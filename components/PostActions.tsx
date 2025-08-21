'use client';

import { useState } from 'react';
import { Heart, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { PostWithProfile } from '@/types/post';
import { useLike } from '@/hooks/useLike';
import { useMutatePost } from '@/hooks/useMutatePost';

interface PostActionsProps {
  post: PostWithProfile;
  currentUserId?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function PostActions({ 
  post, 
  currentUserId, 
  onEdit, 
  onDelete,
  className = '' 
}: PostActionsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { toggleLikeMutation, getOptimisticState, loading } = useLike();
  const { deletePostMutation } = useMutatePost();

  const optimisticLikeState = getOptimisticState(post);
  const displayLikesCount = optimisticLikeState?.likesCount ?? post.likes_count;
  const displayIsLiked = optimisticLikeState?.isLiked ?? post.is_liked;

  const handleLike = () => {
    if (!currentUserId) return;
    toggleLikeMutation(post.id, post);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      await deletePostMutation.mutate(post.id);
      onDelete();
    } catch (error) {
      console.error('Delete failed:', error);
    }
    setShowMenu(false);
  };

  const isOwnPost = currentUserId === post.author_id;

  return (
    <div className={`flex items-center justify-between pt-3 ${className}`}>
      {/* Like Button */}
      <button
        onClick={handleLike}
        disabled={!currentUserId || loading}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
          displayIsLiked
            ? 'text-red-600 bg-red-50 hover:bg-red-100'
            : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
        } ${!currentUserId ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        <Heart 
          size={16} 
          className={displayIsLiked ? 'fill-current' : ''} 
        />
        <span className="text-sm font-medium">
          {displayLikesCount}
        </span>
      </button>

      {/* Actions Menu (for own posts) */}
      {isOwnPost && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <MoreHorizontal size={16} />
          </button>

          {showMenu && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              
              {/* Menu */}
              <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]">
                <button
                  onClick={() => {
                    onEdit?.();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit size={14} />
                  Edit
                </button>
                
                <button
                  onClick={handleDelete}
                                          disabled={deletePostMutation.loading}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        {deletePostMutation.loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
