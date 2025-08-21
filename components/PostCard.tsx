'use client';

import { useState } from 'react';
import { PostWithProfile } from '@/types/post';
import { PostContent } from './PostContent';
import { PostActions } from './PostActions';
import { EditPostComposer } from './EditPostComposer';

interface PostCardProps {
  post: PostWithProfile;
  currentUserId?: string;
  onPostUpdate?: (postId: string, newContent: string) => void;
  onPostDelete?: (postId: string) => void;
}

export function PostCard({ 
  post, 
  currentUserId, 
  onPostUpdate, 
  onPostDelete 
}: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleEditComplete = (newContent?: string) => {
    setIsEditing(false);
    if (newContent && onPostUpdate) {
      onPostUpdate(post.id, newContent);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    onPostDelete?.(post.id);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      {isEditing ? (
        <EditPostComposer
          postId={post.id}
          initialContent={post.content}
          onComplete={handleEditComplete}
          onCancel={handleEditCancel}
        />
      ) : (
        <>
          <PostContent post={post} className="mb-4" />
          <div className="border-t border-gray-100">
            <PostActions
              post={post}
              currentUserId={currentUserId}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </>
      )}
    </div>
  );
}