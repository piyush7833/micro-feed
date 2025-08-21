# Micro Feed

A modern social feed application built with Next.js 14, TypeScript, and Supabase. Features real-time posts, optimistic UI updates, and email authentication.

## 🚀 Quick Setup

### 1. Environment Variables
```bash
cp env.template .env.local
```

Configure your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Database Initialization
1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Configure Authentication settings:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/email-verification`

### 3. Install & Run
```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to start using the app.

## 🏗️ Architecture & Design Decisions

**Server Actions vs Route Handlers**: Chose Next.js 14 Server Actions throughout for consistency and type safety. This eliminates the client/server API boundary complexity, provides better DX with direct function calls from components, reduces boilerplate (no manual request/response handling), and enables automatic form handling with progressive enhancement. Following YAGNI principles - since this isn't a highly complex project requiring custom middleware, rate limiting, or complex API versioning, Server Actions provide simpler maintenance, automatic CSRF protection, and seamless TypeScript integration without the overhead of separate API routes. All mutations (`createPost`, `signUp`, `toggleLike`) use Server Actions with a standardized `ActionResult<T>` pattern for error handling.

**Optimistic UI Strategy**: Initially used React's `useOptimistic`, but switched to a custom `useState`/`useMemo` approach to prevent state resets when server data changes. This provides more granular control over optimistic updates and cleanup logic. Posts, likes, and updates all have immediate UI feedback while server actions complete in the background.

**Authentication & RLS**: Implemented email verification flow with profile creation during email confirmation rather than signup. Row Level Security policies assume authenticated users can only modify their own content, with public read access for posts and profiles. The `user_id` foreign key constraints enforce data ownership at the database level.

## ⏰ Tradeoffs & Scope Decisions

**Skipped for Time**:
- **Image uploads**: Would require file storage setup and processing pipeline
- **Real-time subscriptions**: Supabase real-time would add WebSocket complexity  
- **Post threading/replies**: Requires recursive data structures and UI complexity
- **User following/feed filtering**: Needs relationship tables and complex queries
- **Push notifications**: Would require service worker and notification service setup

**Technical Debt**:
- **Testing**: No unit/integration tests due to time constraints (setting up Jest, React Testing Library, and writing comprehensive test suites would double development time)


The focus was on delivering a working MVP with solid authentication, CRUD operations, and responsive optimistic UI within a reasonable development timeframe.

## 📱 Features

- ✅ **User Authentication** - Email verification with Supabase Auth
- ✅ **Create/Edit/Delete Posts** - Full CRUD with optimistic updates  
- ✅ **Like/Unlike Posts** - Instant feedback with server sync
- ✅ **User Profiles** - Username-based profiles with avatars
- ✅ **Search Posts** - Real-time search as you type
- ✅ **Filter Posts** - Toggle between "All Posts" and "My Posts"
- ✅ **Responsive Design** - Mobile-first with Tailwind CSS
- ✅ **Infinite Scroll** - Automatic loading with Intersection Observer API
- ✅ **Rich Text Editor** - React Quill with formatting options (bold, italic, lists, quotes, etc.)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js Server Actions, Supabase (Auth + Database)
- **Database**: PostgreSQL with Row Level Security
- **Validation**: Zod schemas for type-safe forms 
- **UI Components**: Lucide React icons, custom components

## 📝 Database Schema

Key tables:
- `profiles` - User profile data linked to Supabase Auth
- `posts` - User posts with content and metadata
- `likes` - Many-to-many relationship for post likes

See `supabase-schema.sql` for complete schema with RLS policies.

## 🔗 Links

- [Supabase Configuration Guide](SUPABASE_CONFIG.md) - Detailed auth setup instructions
- [Live Demo](#) - Coming soon
- [GitHub Repository](https://github.com/piyush7833/micro-feed)