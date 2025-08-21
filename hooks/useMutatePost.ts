'use client';

import { useState, useCallback } from 'react';
import { createPost, updatePost, deletePost } from '@/app/actions/posts';
import { CreatePostInput, UpdatePostInput } from '@/lib/validators';

interface UseMutatePostReturn {
  createPostMutation: {
    mutate: (data: CreatePostInput) => Promise<any>;
    loading: boolean;
    error: string | null;
  };
  updatePostMutation: {
    mutate: (postId: string, data: UpdatePostInput) => Promise<void>;
    loading: boolean;
    error: string | null;
  };
  deletePostMutation: {
    mutate: (postId: string) => Promise<void>;
    loading: boolean;
    error: string | null;
  };
}

export function useMutatePost(): UseMutatePostReturn {
  const [createState, setCreateState] = useState({
    loading: false,
    error: null as string | null,
  });
  
  const [updateState, setUpdateState] = useState({
    loading: false,
    error: null as string | null,
  });
  
  const [deleteState, setDeleteState] = useState({
    loading: false,
    error: null as string | null,
  });
  
  const createPostMutation = {
    mutate: useCallback(async (data: CreatePostInput) => {
      setCreateState({ loading: true, error: null });
      
      try {
        const result = await createPost(data);
        setCreateState({ loading: false, error: null });
        return result;
      } catch (error) {
        setCreateState({
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to create post',
        });
        throw error;
      }
    }, []),
    loading: createState.loading,
    error: createState.error,
  };
  
  const updatePostMutation = {
    mutate: useCallback(async (postId: string, data: UpdatePostInput) => {
      setUpdateState({ loading: true, error: null });
      
      try {
        await updatePost(postId, data);
        setUpdateState({ loading: false, error: null });
      } catch (error) {
        setUpdateState({
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to update post',
        });
        throw error;
      }
    }, []),
    loading: updateState.loading,
    error: updateState.error,
  };
  
  const deletePostMutation = {
    mutate: useCallback(async (postId: string) => {
      setDeleteState({ loading: true, error: null });
      
      try {
        await deletePost(postId);
        setDeleteState({ loading: false, error: null });
      } catch (error) {
        setDeleteState({
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to delete post',
        });
        throw error;
      }
    }, []),
    loading: deleteState.loading,
    error: deleteState.error,
  };
  
  return {
    createPostMutation,
    updatePostMutation,
    deletePostMutation,
  };
}
