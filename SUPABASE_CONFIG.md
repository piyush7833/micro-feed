# Supabase Email Verification Configuration

To properly set up email verification with redirect, you need to configure your Supabase project settings.

## 1. Supabase Dashboard Configuration

### Go to Authentication > URL Configuration in your Supabase dashboard:

1. **Site URL**: Set to your application's URL
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`

2. **Redirect URLs**: Add the email verification URL
   - Development: `http://localhost:3000/email-verification`
   - Production: `https://your-domain.com/email-verification`

### Email Templates (Optional but Recommended)

Go to Authentication > Email Templates and customize:

1. **Confirm signup**: 
   - Update the redirect URL to: `{{ .SiteURL }}/email-verification`
   - Customize the email content as needed

## 2. Environment Variables

Make sure your `.env.local` file includes:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # or your production URL
```

## 3. Testing Email Verification

1. Sign up with a new email address
2. Check your email for the verification link
3. Click the verification link
4. You should be redirected to `/email-verification` with a success message
5. After 3 seconds, you'll be automatically redirected to the home page

## 4. Production Deployment

When deploying to production:

1. Update `NEXT_PUBLIC_SITE_URL` to your production domain
2. Add your production domain to the Supabase redirect URLs
3. Update the Site URL in Supabase dashboard

## Flow Overview

```
User signs up → Email sent → User clicks link → /email-verification → Profile created → Success → Home page
```

The email verification page handles:
- Token validation from URL parameters
- Session establishment
- **User profile creation from metadata**
- Success/error messaging
- Automatic redirect to home page

### Profile Creation During Verification

The profile is now created during email verification instead of first login:

1. **Signup**: Username stored in `user_metadata`
2. **Email verification**: Profile created from `user_metadata.username`
3. **Login**: Profile already exists and ready to use

This ensures users have a complete profile setup as soon as they verify their email.
