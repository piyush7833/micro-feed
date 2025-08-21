# Micro Feed - Next.js Social Feed App

A minimal, modern social feed application built with Next.js 14, TypeScript, and Supabase. Users can create short posts (≤280 characters), engage with content through likes, and manage their own posts with full CRUD functionality.

## ✨ Features

- **Authentication**: Email/password signup and signin with Supabase Auth
- **Post Management**: Create, read, update, and delete posts (≤280 characters)
- **Social Engagement**: Like/unlike posts with optimistic UI updates
- **Advanced Filtering**: View all posts or filter to show only your own posts
- **Real-time Search**: Server-side search functionality with debounced input
- **Cursor Pagination**: Efficient pagination for better performance with large datasets
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Type Safety**: Full TypeScript implementation with Zod validation

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **State Management**: React hooks with optimistic updates
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd micro-feed2
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Supabase project details:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Set up the database**:
   
   Run the following SQL in your Supabase SQL editor:

   ```sql
   -- Create profiles table
   create table if not exists profiles (
     id uuid primary key references auth.users(id) on delete cascade,
     username text unique not null,
     created_at timestamptz default now()
   );

   -- Create posts table
   create table if not exists posts (
     id uuid primary key default gen_random_uuid(),
     author_id uuid not null references profiles(id) on delete cascade,
     content text not null check (char_length(content) <= 280),
     created_at timestamptz default now(),
     updated_at timestamptz default now()
   );

   -- Create likes table
   create table if not exists likes (
     post_id uuid references posts(id) on delete cascade,
     user_id uuid references profiles(id) on delete cascade,
     created_at timestamptz default now(),
     primary key (post_id, user_id)
   );

   -- Enable Row Level Security
   alter table profiles enable row level security;
   alter table posts enable row level security;
   alter table likes enable row level security;

   -- Profiles policies: read all, write self
   create policy "read profiles" on profiles for select using (true);
   create policy "upsert self profile" on profiles
     for all using (auth.uid() = id) with check (auth.uid() = id);

   -- Posts policies: read all; insert/update/delete only own
   create policy "read posts" on posts for select using (true);
   create policy "insert own posts" on posts for insert with check (auth.uid() = author_id);
   create policy "update own posts" on posts for update using (auth.uid() = author_id);
   create policy "delete own posts" on posts for delete using (auth.uid() = author_id);

   -- Likes policies: read all; like/unlike as self
   create policy "read likes" on likes for select using (true);
   create policy "like" on likes for insert with check (auth.uid() = user_id);
   create policy "unlike" on likes for delete using (auth.uid() = user_id);
   ```

5. **Configure email verification** (Optional):
   
   For email verification to work properly, configure your Supabase project:
   - In Supabase Dashboard → Authentication → URL Configuration
   - Set Site URL to: `http://localhost:3000` (or your domain)
   - Add Redirect URL: `http://localhost:3000/email-verification`
   
   See `SUPABASE_CONFIG.md` for detailed setup instructions.

6. **Start the development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Usage

1. **Sign Up/Sign In**: Create an account or sign in with existing credentials
2. **Create Posts**: Share your thoughts in 280 characters or less
3. **Engage**: Like posts from other users with optimistic UI updates
4. **Manage**: Edit or delete your own posts using the post menu
5. **Filter**: Switch between viewing all posts or just your own posts
6. **Search**: Use the search bar to find posts by keywords

## 🏗 Architecture

### Project Structure

```
micro-feed2/
├── app/
│   ├── actions/          # Server actions for posts and auth
│   ├── email-verification/ # Email verification success page
│   ├── globals.css       # Global styles and Tailwind imports
│   ├── layout.tsx        # Root layout component
│   └── page.tsx          # Main feed page
├── components/           # React components
│   ├── AuthModal.tsx     # Authentication modal
│   ├── Composer.tsx      # Post creation/editing component
│   ├── Header.tsx        # App header with user menu
│   ├── PostCard.tsx      # Individual post display
│   ├── SearchBar.tsx     # Search input component
│   └── Toolbar.tsx       # Filter and search toolbar
├── hooks/                # Custom React hooks
│   ├── useLike.ts        # Optimistic like/unlike functionality
│   ├── useMutatePost.ts  # Post CRUD operations
│   └── usePosts.ts       # Post fetching and pagination
├── lib/                  # Utility libraries
│   ├── db.ts             # Supabase client configuration
│   ├── pagination.ts     # Cursor pagination utilities
│   └── validators.ts     # Zod validation schemas
└── types/
    └── post.ts           # TypeScript type definitions
```

### Key Design Decisions

1. **Server Actions**: Leverages Next.js 14's server actions for direct server-side mutations
2. **Optimistic Updates**: Likes are updated optimistically for better UX, with automatic rollback on errors
3. **Cursor Pagination**: Uses cursor-based pagination instead of offset pagination for better performance
4. **Row Level Security**: Database access is secured through Supabase RLS policies
5. **Type Safety**: Full TypeScript coverage with runtime validation using Zod

## 🔒 Security Features

- **Row Level Security (RLS)**: All database operations are secured with Supabase RLS policies
- **Authentication Required**: Post creation, editing, deletion, and liking require authentication
- **Ownership Validation**: Users can only edit/delete their own posts
- **Input Validation**: All user inputs are validated both client-side and server-side
- **SQL Injection Prevention**: Supabase client handles all SQL parameterization

## 🎨 UI/UX Features

- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Loading States**: Proper loading indicators for all async operations
- **Error Handling**: User-friendly error messages with retry options
- **Optimistic Updates**: Like actions update immediately with rollback on failure
- **Character Counter**: Real-time character count with visual feedback
- **Modern Design**: Clean, minimal interface with smooth transitions

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Add your environment variables in the Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js applications:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔧 Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and commit: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Troubleshooting

### Common Issues

1. **Supabase connection issues**: Verify your `.env.local` file has the correct Supabase URL and anon key
2. **Database errors**: Ensure you've run all the SQL scripts in your Supabase project
3. **Authentication issues**: Check that your Supabase project has email authentication enabled
4. **Build errors**: Run `npm run type-check` to identify TypeScript issues

### Getting Help

- Check the [Next.js documentation](https://nextjs.org/docs)
- Review [Supabase documentation](https://supabase.com/docs)
- Open an issue on the repository for bugs or questions

---

Built with ❤️ using Next.js 14, TypeScript, and Supabase.
#   m i c r o - f e e d  
 