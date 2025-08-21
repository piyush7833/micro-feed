'use server';

import { createSupabaseServerClient } from '@/lib/db-server';
import { redirect } from 'next/navigation';

export async function handleEmailVerification(accessToken: string, refreshToken: string) {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    if (error) {
      throw error;
    }

    if (data.user && data.session) {
      // Check if profile exists, create if it doesn't
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!existingProfile && profileError?.code === 'PGRST116') {
        const username = data.user.user_metadata?.username;
        
        if (username) {
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              username: username,
            });

          if (createProfileError) {
            console.error('Error creating profile:', createProfileError);
          }
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Email verification error:', error);
    return { success: false, error: 'Failed to verify email' };
  }
}


