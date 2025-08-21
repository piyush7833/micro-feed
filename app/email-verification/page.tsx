'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Home } from 'lucide-react';
import { createClientComponentClient } from '@/lib/db-client';

export default function EmailVerificationPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Function to create user profile from metadata
  const createUserProfile = async (user: any) => {
    const supabase = createClientComponentClient();
    
    try {
      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        return;
      }

      if (checkError && checkError.code !== 'PGRST116') {
        return;
      }

      // Profile doesn't exist, create it from user metadata
      const username = user.user_metadata?.username;
      
      if (!username) {
        return;
      }

      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: username,
        });

      if (createError) {
        // Profile creation failed, will be handled on first login as fallback
        return;
      }
    } catch (error) {
      // Unexpected error, will be handled on first login as fallback
      return;
    }
  };

  useEffect(() => {
    const handleEmailVerification = async () => {
      const supabase = createClientComponentClient();
      
      try {
        // Check for hash fragments (most common with Supabase)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            setStatus('error');
            setMessage('Failed to verify email. Please try again.');
            return;
          }

          if (data.user && data.session) {
            // Create profile if it doesn't exist
            await createUserProfile(data.user);
            
            setStatus('success');
            setMessage('Email successfully verified! Your account is now active.');
            
            // Force a page refresh to ensure session persistence
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
            return;
          }
        }

        // Check for URL search params (alternative method)
        const tokenHash = searchParams.get('token_hash');
        const paramType = searchParams.get('type');

        if (paramType === 'email' && tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'email'
          });

          if (error) {
            setStatus('error');
            setMessage(error.message || 'Failed to verify email. The link may have expired.');
            return;
          }

          if (data.user && data.session) {
            // Create profile if it doesn't exist
            await createUserProfile(data.user);
            
            setStatus('success');
            setMessage('Email successfully verified! Your account is now active.');
            
            // Force a page refresh to ensure session persistence
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
            return;
          }
        }

        // Check if user is already signed in (page refresh after verification)
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (!userError && user) {
          // Ensure profile exists
          await createUserProfile(user);
          
          setStatus('success');
          setMessage('Email verified! Your account is ready.');
          
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
          return;
        }

        // No valid verification method found
        setStatus('error');
        setMessage('Invalid verification link. Please request a new verification email.');
        
      } catch (error) {
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    handleEmailVerification();
  }, [router, searchParams]);

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            {status === 'loading' && (
              <>
                <Loader2 className="w-16 h-16 mx-auto text-blue-500 animate-spin mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h1>
                <p className="text-gray-600">Please wait while we verify your email address...</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
                <p className="text-gray-600 mb-4">{message}</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-700">
                    🎉 Redirecting to home page in 3 seconds...
                  </p>
                </div>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
                <p className="text-gray-600 mb-4">{message}</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700">
                    If you continue having issues, please contact support.
                  </p>
                </div>
              </>
            )}
          </div>

          {(status === 'success' || status === 'error') && (
            <button
              onClick={handleGoHome}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Go to Home</span>
            </button>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Having trouble? Try refreshing the page or{' '}
            <button
              onClick={handleGoHome}
              className="text-blue-500 hover:text-blue-600 underline"
            >
              go back to home
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
