'use client';

import { PostWithProfile } from '@/types/post';

interface PostContentProps {
  post: PostWithProfile;
  className?: string;
}

export function PostContent({ post, className = '' }: PostContentProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h`;
    } else if (diffInSeconds < 604800) {
      return `${Math.floor(diffInSeconds / 86400)}d`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
          {post.profiles.username.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">
              @{post.profiles.username}
            </h3>
            <span className="text-gray-500 text-sm">
              {formatTimestamp(post.created_at)}
            </span>
            {post.updated_at !== post.created_at && (
              <span className="text-gray-400 text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                edited
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="prose prose-sm max-w-none">
        <div 
          dangerouslySetInnerHTML={{ __html: post.content }}
          className="text-gray-800 leading-relaxed break-words [&>h1]:text-lg [&>h1]:font-bold [&>h1]:mb-2 [&>h2]:text-base [&>h2]:font-bold [&>h2]:mb-2 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:mb-1 [&>p]:mb-2 [&>ul]:ml-4 [&>ul]:mb-2 [&>ol]:ml-4 [&>ol]:mb-2 [&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-gray-600 [&>code]:bg-gray-100 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>strong]:font-semibold [&>em]:italic [&>a]:text-blue-600 [&>a]:underline hover:[&>a]:text-blue-800"
        />
      </div>
    </div>
  );
}
