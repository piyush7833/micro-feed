'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Header } from '@/components/Header';
import { AuthModal } from '@/components/AuthModal';
import { Composer } from '@/components/Composer';
import { PostCard } from '@/components/PostCard';
import { Toolbar } from '@/components/Toolbar';
import { usePosts } from '@/hooks/usePosts';
import { PostFilter, PostWithProfile } from '@/types/post';
import { getCurrentUser } from '@/app/actions/auth';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filter, setFilter] = useState<PostFilter>('all');
  
  const { 
    posts, 
    loading, 
    error, 
    hasMore, 
    loadMore, 
    refresh, 
    updateSearchParams
  } = usePosts({ 
    search: searchValue, 
    filter,
    limit: 10 
  });
  
  // Use persistent optimistic state like useLike - doesn't reset when posts change
  const [optimisticPostUpdates, setOptimisticPostUpdates] = useState<{
    added: PostWithProfile[];
    updated: Record<string, string>; // postId -> newContent
    deleted: Set<string>; // Set of deleted postIds
    published: Set<string>; // Set of temp post IDs that are now published
  }>({
    added: [],
    updated: {},
    deleted: new Set(),
    published: new Set()
  });

  // Apply optimistic updates to posts
  const optimisticPosts = useMemo(() => {
    let result = [...posts];
    
    // Apply deletions
    result = result.filter(post => !optimisticPostUpdates.deleted.has(post.id));
    
    // Apply updates
    result = result.map(post => {
      if (optimisticPostUpdates.updated[post.id]) {
        return {
          ...post,
          content: optimisticPostUpdates.updated[post.id],
          updated_at: new Date().toISOString()
        };
      }
      return post;
    });
    
    // Add new posts at the beginning and apply updates to them too
    const addedPosts = optimisticPostUpdates.added.map(post => {
      let updatedPost = { ...post };
      
      // Apply updates to added posts too
      if (optimisticPostUpdates.updated[post.id]) {
        updatedPost = {
          ...updatedPost,
          content: optimisticPostUpdates.updated[post.id],
          updated_at: new Date().toISOString()
        };
      }
      
      return updatedPost;
    });
    result = [...addedPosts, ...result];
    
    return result;
  }, [posts, optimisticPostUpdates]);
  
  // Get current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setUserLoading(false);
      }
    };
    
    fetchUser();
  }, []);
  
  // Update search params when filter or search changes
  useEffect(() => {
    updateSearchParams({ search: searchValue, filter });
  }, [searchValue, filter]); // Removed updateSearchParams to avoid infinite loops
  
  // Clean up optimistic state when server posts change
  useEffect(() => {
    setOptimisticPostUpdates(prev => {
      const serverPostIds = new Set(posts.map(p => p.id));
      
      // Remove optimistic posts that now exist on server
      const filteredAdded = prev.added.filter(addedPost => {
        // Remove if the real ID exists on server (post was successfully created)
        return !serverPostIds.has(addedPost.id);
      });
      
      // Remove updates for posts that no longer exist on server OR in added posts
      const addedPostIds = new Set(prev.added.map(p => p.id));
      const filteredUpdated = Object.fromEntries(
        Object.entries(prev.updated).filter(([postId]) => 
          (serverPostIds.has(postId) || addedPostIds.has(postId)) && prev.updated[postId] !== undefined
        )
      );
      
      // Remove deletes for posts that no longer exist on server (they were actually deleted)
      const filteredDeleted = new Set(Array.from(prev.deleted).filter(postId => 
        serverPostIds.has(postId)
      ));
      
              return {
          added: filteredAdded,
          updated: filteredUpdated, 
          deleted: filteredDeleted,
          published: prev.published || new Set()
        };
    });
  }, [posts]);
  
  // Listen for successful post creation to clean up temp posts
  useEffect(() => {
    const handlePostCreated = () => {
      setOptimisticPostUpdates(prev => ({
        ...prev,
        added: prev.added.filter(post => {
          if (post.id.startsWith('temp-')) {
            const timestamp = parseInt(post.id.split('-')[1]);
            const age = Date.now() - timestamp;
            return age < 2000; // Remove temp posts older than 2 seconds
          }
          return true;
        })
      }));
    };
    
    window.addEventListener('postCreated', handlePostCreated);
    return () => window.removeEventListener('postCreated', handlePostCreated);
  }, []);
  
  const handleFilterChange = (newFilter: PostFilter) => {
    setFilter(newFilter);
  };
  
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };
  
  
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user} 
        onSignInClick={() => setShowAuthModal(true)} 
      />
      
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Composer - only show for authenticated users */}
        {user && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Create a post</h2>
              <p className="text-sm text-gray-500">Share what's on your mind</p>
            </div>
            <Composer 
              onOptimisticCreate={(content) => {
                if (user) {
                  const tempId = `temp-${Date.now()}`;
                  const optimisticPost: PostWithProfile = {
                    id: tempId,
                    author_id: user.id,
                    content,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    profiles: {
                      id: user.id,
                      username: user.profile?.username || 'User',
                      created_at: new Date().toISOString()
                    },
                    likes_count: 0,
                    is_liked: false,
                  };
                  setOptimisticPostUpdates(prev => ({
                    ...prev,
                    added: [optimisticPost, ...prev.added]
                  }));
                }
              }}
              onOptimisticSuccess={(realPost) => {
                // Update the temp post with real ID and mark as published
                setOptimisticPostUpdates(prev => {
                  const latestTempPost = prev.added.find(p => p.id.startsWith('temp-'));
                  if (latestTempPost && realPost) {
                    // Replace temp post with real post data
                    const updatedAdded = prev.added.map(post => 
                      post.id === latestTempPost.id 
                        ? { ...realPost, profiles: post.profiles } // Keep the optimistic profile
                        : post
                    );
                    return {
                      ...prev,
                      added: updatedAdded,
                      published: new Set([...Array.from(prev.published || new Set()), realPost.id])
                    };
                  } else if (latestTempPost) {
                    // Fallback: just mark as published if no real post data
                    return {
                      ...prev,
                      published: new Set([...Array.from(prev.published || new Set()), latestTempPost.id])
                    };
                  }
                  return prev;
                });
              }}
            />
          </div>
        )}
        
        {/* Toolbar */}
        <Toolbar
          filter={filter}
          onFilterChange={handleFilterChange}
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          isAuthenticated={!!user}
          loading={loading}
        />
        
        {/* Feed */}
        <div className="space-y-4 relative">
          {/* Loading overlay for filter changes */}
          {loading && optimisticPosts.length > 0 && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="flex flex-col items-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                <p className="text-sm text-gray-600">Updating posts...</p>
              </div>
            </div>
          )}
          
          {/* Loading state for initial load */}
          {loading && posts.length === 0 && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-gray-500">Loading posts...</p>
            </div>
          )}
          
          {/* Error state */}
          {error && (
            <div className="text-center py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-red-600 mb-2">{error}</p>
                <button
                  onClick={refresh}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Try again
                </button>
              </div>
            </div>
          )}
          
          {/* Posts */}
          {optimisticPosts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUserId={user?.id}
              onPostUpdate={(postId, newContent) => {
                setOptimisticPostUpdates(prev => ({
                  ...prev,
                  updated: { ...prev.updated, [postId]: newContent }
                }));
              }}
              onPostDelete={(postId) => {
                setOptimisticPostUpdates(prev => ({
                  ...prev,
                  deleted: new Set([...Array.from(prev.deleted), postId])
                }));
              }}
              onRevertUpdate={(postId) => {
                setOptimisticPostUpdates(prev => ({
                  ...prev,
                  updated: Object.fromEntries(Object.entries(prev.updated).filter(([id]) => id !== postId))
                }));
              }}
              onRevertDelete={(postId, originalPost) => {
                setOptimisticPostUpdates(prev => ({
                  ...prev,
                  deleted: new Set(Array.from(prev.deleted).filter(id => id !== postId))
                }));
              }}
              optimisticUpdates={optimisticPostUpdates}
            />
          ))}
          
          {/* Empty state */}
          {!loading && !error && posts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === 'mine' ? 'No posts yet' : searchValue ? 'No posts found' : 'No posts yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {filter === 'mine' 
                  ? 'Create your first post to get started!' 
                  : searchValue 
                    ? 'Try adjusting your search terms'
                    : 'Be the first to share something!'
                }
              </p>
              {!user && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Sign in to post
                </button>
              )}
            </div>
          )}
          
          {/* Load more button */}
          {hasMore && optimisticPosts.length > 0 && (
            <div className="text-center py-4">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Load more</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
