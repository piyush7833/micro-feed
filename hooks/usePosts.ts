'use client';

import { useState, useCallback, useEffect } from 'react';
import { PostWithProfile, PostsResponse, SearchParams } from '@/types/post';
import { SearchParamsInput } from '@/lib/validators';
import { getPosts } from '@/app/actions/posts';

interface UsePostsState {
  posts: PostWithProfile[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor?: { created_at: string; id: string };
}

interface UsePostsReturn extends UsePostsState {
  loadMore: () => void;
  refresh: () => void;
  updateSearchParams: (params: Partial<SearchParamsInput>) => void;
}

export function usePosts(initialParams: Partial<SearchParamsInput> = {}): UsePostsReturn {
  const [state, setState] = useState<UsePostsState>({
    posts: [],
    loading: true,
    error: null,
    hasMore: false,
  });
  
  const [searchParams, setSearchParams] = useState<SearchParamsInput>({
    filter: 'all',
    limit: 10,
    ...initialParams,
  });
  
  // Track searchParams changes for debugging if needed
  // useEffect(() => {
  //   console.log('🔍 searchParams changed:', searchParams);
  // }, [searchParams]);
  
  const fetchPosts = useCallback(async (
    params: SearchParamsInput, 
    append: boolean = false
  ) => {
    if (!append) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }
    
    try {
      const result: PostsResponse = await getPosts(params);
      
      setState(prev => {
        // When refreshing (not appending), filter out optimistic posts to avoid duplicates
        const newPosts = append 
          ? [...prev.posts, ...result.posts] 
          : result.posts;
        
        // usePosts: fetchPosts completed
        
        return {
          ...prev,
          posts: newPosts,
          hasMore: result.hasMore,
          nextCursor: result.nextCursor,
          loading: false,
          error: null,
        };
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch posts',
      }));
    }
  }, []); // fetchPosts doesn't need dependencies - it gets params as arguments
  
  const loadMore = useCallback(() => {
    if (state.loading || !state.hasMore || !state.nextCursor) return;
    
    const cursorString = btoa(JSON.stringify(state.nextCursor));
    fetchPosts({ ...searchParams, cursor: cursorString }, true);
  }, [state.loading, state.hasMore, state.nextCursor, searchParams]);
  
  const refresh = useCallback(() => {
    fetchPosts({ ...searchParams, cursor: undefined }, false);
  }, [searchParams]);
  
  const updateSearchParams = useCallback((params: Partial<SearchParamsInput>) => {
    const newParams = { ...searchParams, ...params, cursor: undefined };
    setSearchParams(newParams);
    fetchPosts(newParams, false);
  }, [searchParams]);
  
  // Initial load and when search params change
  useEffect(() => {
    fetchPosts(searchParams, false);
  }, [searchParams.search, searchParams.filter]); // Only depend on search and filter, not cursor
  
  return {
    ...state,
    loadMore,
    refresh,
    updateSearchParams,
  };
}
