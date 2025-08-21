'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/db';
import { 
  createPostSchema, 
  updatePostSchema, 
  searchParamsSchema 
} from '@/lib/validators';
import { PostWithProfile, PostsResponse } from '@/types/post';
import { SearchParamsInput, CreatePostInput, UpdatePostInput } from '@/lib/validators';
import { parseCursor, DEFAULT_PAGE_SIZE } from '@/lib/pagination';

export async function getPosts(searchParams: SearchParamsInput): Promise<PostsResponse> {
  const supabase = createServerComponentClient();
  
  // Validate search parameters
  const validatedParams = searchParamsSchema.parse(searchParams);
  const { search, filter, cursor, limit = DEFAULT_PAGE_SIZE } = validatedParams;
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  // Build query - simplified to avoid complex joins that filter out posts
  let query = supabase
    .from('posts')
    .select(`
      *,
      profiles:author_id(id, username, created_at)
    `)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1); // Fetch one extra to check if there are more pages

  // Apply filters
  if (search) {
    query = query.ilike('content', `%${search}%`);
  }
  
  if (filter === 'mine' && user) {
    query = query.eq('author_id', user.id);
  }
  
  // Apply cursor pagination
  if (cursor) {
    const parsedCursor = parseCursor(cursor);
    if (parsedCursor) {
      query = query.or(
        `created_at.lt.${parsedCursor.created_at},and(created_at.eq.${parsedCursor.created_at},id.lt.${parsedCursor.id})`
      );
    }
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching posts:', error);
    throw new Error('Failed to fetch posts');
  }
  
  // Process the data to get likes count and user's like status
  const posts = await Promise.all(
    (data || []).map(async (post) => {
      // Get likes count
      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);
      
      // Check if current user liked this post
      let isLiked = false;
      if (user) {
        const { data: likeData } = await supabase
          .from('likes')
          .select('user_id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .single();
        isLiked = !!likeData;
      }
      
      return {
        ...post,
        likes_count: likesCount || 0,
        is_liked: isLiked,
      } as PostWithProfile;
    })
  );
  
  // Check if there are more pages
  const hasMore = posts.length > limit;
  const postsToReturn = hasMore ? posts.slice(0, limit) : posts;
  
  // Generate next cursor
  let nextCursor;
  if (hasMore && postsToReturn.length > 0) {
    const lastPost = postsToReturn[postsToReturn.length - 1];
    nextCursor = {
      created_at: lastPost.created_at,
      id: lastPost.id,
    };
  }
  
  return {
    posts: postsToReturn,
    nextCursor,
    hasMore,
  };
}

export async function createPost(data: CreatePostInput) {
  const supabase = createServerComponentClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Authentication required');
  }
  
  // Validate input
  const validatedData = createPostSchema.parse(data);
  
  // Create post
  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      content: validatedData.content,
    })
    .select(`
      *,
      profiles:author_id(id, username, created_at)
    `)
    .single();
  
  if (error) {
    console.error('Error creating post:', error);
    throw new Error('Failed to create post');
  }
  
  // Don't revalidate for creates - let optimistic UI handle it
  
  return {
    ...post,
    likes_count: 0,
    is_liked: false,
  } as PostWithProfile;
}

export async function updatePost(postId: string, data: UpdatePostInput) {
  const supabase = createServerComponentClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Authentication required');
  }
  
  // Validate input
  const validatedData = updatePostSchema.parse(data);
  
  // Update post (RLS will ensure user can only update their own posts)
  const { data: post, error } = await supabase
    .from('posts')
    .update({
      content: validatedData.content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .eq('author_id', user.id) // Extra security check
    .select(`
      *,
      profiles:author_id(id, username, created_at)
    `)
    .single();
  
  if (error) {
    console.error('Error updating post:', error);
    if (error.code === 'PGRST116') {
      throw new Error('Post not found or permission denied');
    }
    throw new Error('Failed to update post');
  }
  
  // Don't revalidate for updates - let optimistic UI handle it
  return post;
}

export async function deletePost(postId: string) {
  const supabase = createServerComponentClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Authentication required');
  }
  
  // Delete post (RLS will ensure user can only delete their own posts)
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', user.id); // Extra security check
  
  if (error) {
    console.error('Error deleting post:', error);
    if (error.code === 'PGRST116') {
      throw new Error('Post not found or permission denied');
    }
    throw new Error('Failed to delete post');
  }
  
  // Don't revalidate for deletes - let optimistic UI handle it
}

export async function toggleLike(postId: string) {
  const supabase = createServerComponentClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Authentication required');
  }
  
  // Check if user has already liked this post
  const { data: existingLike, error: likeCheckError } = await supabase
    .from('likes')
    .select('user_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();
  
  if (likeCheckError && likeCheckError.code !== 'PGRST116') {
    console.error('Error checking like status:', likeCheckError);
    throw new Error('Failed to check like status');
  }
  
  if (existingLike) {
    // Unlike the post
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error unliking post:', error);
      throw new Error('Failed to unlike post');
    }
    
    // Don't revalidate for likes - let optimistic UI handle it
    return { liked: false };
  } else {
    // Like the post
    const { error } = await supabase
      .from('likes')
      .insert({
        post_id: postId,
        user_id: user.id,
      });
    
    if (error) {
      console.error('Error liking post:', error);
      throw new Error('Failed to like post');
    }
    
    // Don't revalidate for likes - let optimistic UI handle it
    return { liked: true };
  }
}
