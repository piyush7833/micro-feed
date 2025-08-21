'use client';

import { useState, useCallback } from 'react';
import { toggleLike } from '@/app/actions/posts';
import { PostWithProfile } from '@/types/post';

interface OptimisticLikeState {
  isLiked: boolean;
  likesCount: number;
}

interface UseLikeReturn {
  toggleLikeMutation: (postId: string, currentPost: PostWithProfile) => Promise<void>;
  loading: boolean;
  error: string | null;
  getOptimisticState: (post: PostWithProfile) => OptimisticLikeState;
}

export function useLike(): UseLikeReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track optimistic updates by post ID
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, OptimisticLikeState>>({});
  
  const toggleLikeMutation = useCallback(async (postId: string, currentPost: PostWithProfile) => {
    setLoading(true);
    setError(null);
    
    // Get current state from optimistic updates or from the post itself
    const currentState = optimisticUpdates[postId] || {
      isLiked: currentPost.is_liked,
      likesCount: currentPost.likes_count,
    };
    
    // Apply optimistic update
    const newIsLiked = !currentState.isLiked;
    const newLikesCount = currentState.likesCount + (newIsLiked ? 1 : -1);
    
    setOptimisticUpdates(prev => ({
      ...prev,
      [postId]: {
        isLiked: newIsLiked,
        likesCount: newLikesCount,
      },
    }));
    
    try {
      await toggleLike(postId);
      setLoading(false);
      setError(null);
      
      // Keep optimistic update - don't remove it since revalidatePath doesn't work for client components
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticUpdates(prev => ({
        ...prev,
        [postId]: currentState,
      }));
      
      setLoading(false);
      setError(error instanceof Error ? error.message : 'Failed to update like');
    }
  }, [optimisticUpdates]);
  
  const getOptimisticState = useCallback((post: PostWithProfile): OptimisticLikeState => {
    const optimisticState = optimisticUpdates[post.id];
    
    if (optimisticState) {
      return optimisticState;
    }
    
    // Return current post state without initializing optimistic state
    // This prevents unnecessary re-renders
    return {
      isLiked: post.is_liked,
      likesCount: post.likes_count,
    };
  }, [optimisticUpdates]);
  
  return {
    toggleLikeMutation: (postId: string, currentPost: PostWithProfile) => toggleLikeMutation(postId, currentPost),
    loading,
    error,
    getOptimisticState,
  };
}
