'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/db-server';
import {
  SignUpSchema,
  SignInSchema,
  UpdateProfileSchema,
  type SignUpInput,
  type SignInInput,
  type UpdateProfileInput,
  type ActionResult,
} from '@/lib/validators';
import { ERROR_MESSAGES } from '@/lib/constants';
import type { Profile } from '@/types/post';

// Sign up a new user
export async function signUp(input: SignUpInput): Promise<ActionResult<void>> {
  try {
    // Validate input
    const validatedData = SignUpSchema.parse(input);
    const supabase = await createSupabaseServerClient();

    // Check if username is already taken
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', validatedData.username)
      .single();
    
    if (existingProfile) {
      return {
        success: false,
        error: ERROR_MESSAGES.USERNAME_TAKEN,
        field: 'username',
      };
    }

    // Sign up user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          username: validatedData.username,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/email-verification`,
      },
    });

    if (signUpError) {
      return {
        success: false,
        error: signUpError.message || 'Failed to sign up',
      };
    }

    // Handle different signup scenarios - profile will be created on first login
    if (data.user && data.session) {
      // Immediate signup success (email confirmation disabled)
      revalidatePath('/');
      return {
        success: true,
        data: undefined,
      };
    } else if (data.user && !data.session) {
      // User created but needs email confirmation
      return {
        success: true,
        data: undefined,
        message: 'Account created successfully! 📧\n\nPlease check your email inbox and click the confirmation link to complete your registration. Your profile will be set up when you first sign in.',
      };
    } else {
      return {
        success: false,
        error: 'Failed to create account. Please try again.',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: ERROR_MESSAGES.INVALID_INPUT,
    };
  }
}

// Sign in user  
export async function signIn(input: SignInInput): Promise<ActionResult<{access_token: string, refresh_token: string} | void>> {
  try {
    // Validate input
    const validatedData = SignInSchema.parse(input);
    
    const supabase = await createSupabaseServerClient();

    // Sign in user
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (signInError) {
      console.error('Sign in error:', signInError);
      return {
        success: false,
        error: signInError.message || 'Failed to sign in',
      };
    }

        // Profile should have been created during email verification
    if (data.session && data.user) {
      revalidatePath('/');
      
      return {
        success: true,
        data: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      };
    } else {
      return {
        success: false,
        error: 'Failed to establish session. Please try again.',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: ERROR_MESSAGES.INVALID_INPUT,
    };
  }
}

// Sign out user
export async function signOut(): Promise<ActionResult<void>> {
  try {
    console.log('Server signOut action called');
    const supabase = await createSupabaseServerClient();

    // Clear server-side session and cookies
    const { error: signOutError } = await supabase.auth.signOut({ 
      scope: 'global' // Clear session on all devices
    });

    if (signOutError) {
      console.error('Server sign out error:', signOutError);
      return {
        success: false,
        error: signOutError.message || 'Failed to sign out',
      };
    }

    console.log('Server session cleared successfully');
    revalidatePath('/');
    
    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Sign out action error:', error);
    return {
      success: false,
      error: 'Failed to sign out',
    };
  }
}

// Update user profile
export async function updateProfile(input: UpdateProfileInput): Promise<ActionResult<Profile>> {
  try {
    // Validate input
    const validatedData = UpdateProfileSchema.parse(input);
    
    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      };
    }

    // Update profile
    const updateData: any = {};
    if (validatedData.username !== undefined) {
      updateData.username = validatedData.username;
    }

    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update profile error:', updateError);
      if (updateError.code === '23505') {
        return {
          success: false,
          error: 'Username is already taken',
          field: 'username',
        };
      }
      return {
        success: false,
        error: updateError.message || 'Failed to update profile',
      };
    }

    revalidatePath('/');

    return {
      success: true,
      data: profile,
    };
  } catch (error) {
    console.error('Update profile action error:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.INVALID_INPUT,
    };
  }
}

// Get current user profile
export async function getCurrentUserProfile(): Promise<ActionResult<Profile>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Get profile error:', profileError);
      return {
        success: false,
        error: profileError.message || ERROR_MESSAGES.USER_NOT_FOUND,
      };
    }

    return {
      success: true,
      data: profile,
    };
  } catch (error) {
    console.error('Get current user profile action error:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.UNKNOWN_ERROR,
    };
  }
}

// Legacy wrapper for getCurrentUser (for backward compatibility)
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  // Profile should exist since it's created during email verification
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (profileError) {
    // Profile doesn't exist - fallback for edge cases
    return null;
  }
  
  return {
    id: user.id,
    email: user.email,
    profile,
  };
}

// Legacy wrappers for backward compatibility
export async function signUpWithEmail(email: string, password: string, username: string) {
  const result = await signUp({ email, password, username });
  if (!result.success) {
    throw new Error(result.error);
  }
}

export async function signInWithEmail(email: string, password: string) {
  const result = await signIn({ email, password });
  if (!result.success) {
    throw new Error(result.error);
  }
}