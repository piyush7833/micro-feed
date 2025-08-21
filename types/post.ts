export interface Profile {
  id: string;
  username: string;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  likes_count?: number;
  is_liked?: boolean;
}

export interface Like {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostWithProfile extends Post {
  profiles: Profile;
  likes_count: number;
  is_liked: boolean;
}

export interface CreatePostRequest {
  content: string;
}

export interface UpdatePostRequest {
  content: string;
}

export interface PaginationCursor {
  created_at: string;
  id: string;
}

export interface PostsResponse {
  posts: PostWithProfile[];
  nextCursor?: PaginationCursor;
  hasMore: boolean;
}

export interface SearchParams {
  search?: string;
  filter?: 'all' | 'mine';
  cursor?: string;
  limit?: number;
}

export type PostFilter = 'all' | 'mine';

export interface OptimisticPost extends Omit<PostWithProfile, 'id' | 'created_at' | 'updated_at'> {
  id: string;
  created_at: string;
  updated_at: string;
  optimistic?: boolean;
}
