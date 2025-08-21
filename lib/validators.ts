import { z } from 'zod';
import { APP_CONFIG } from './constants';

// Auth schemas
export const SignUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z
    .string()
    .min(APP_CONFIG.MIN_USERNAME_LENGTH, `Username must be at least ${APP_CONFIG.MIN_USERNAME_LENGTH} characters`)
    .max(APP_CONFIG.MAX_USERNAME_LENGTH, `Username must be ${APP_CONFIG.MAX_USERNAME_LENGTH} characters or less`)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
});

export const SignInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const UpdateProfileSchema = z.object({
  username: z
    .string()
    .min(APP_CONFIG.MIN_USERNAME_LENGTH, `Username must be at least ${APP_CONFIG.MIN_USERNAME_LENGTH} characters`)
    .max(APP_CONFIG.MAX_USERNAME_LENGTH, `Username must be ${APP_CONFIG.MAX_USERNAME_LENGTH} characters or less`)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
});

// Post schemas
export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, 'Post content is required')
    .max(APP_CONFIG.MAX_POST_LENGTH, `Post content must be ${APP_CONFIG.MAX_POST_LENGTH} characters or less`)
    .trim(),
});

export const updatePostSchema = z.object({
  content: z
    .string()
    .min(1, 'Post content is required')
    .max(APP_CONFIG.MAX_POST_LENGTH, `Post content must be ${APP_CONFIG.MAX_POST_LENGTH} characters or less`)
    .trim(),
});

export const searchParamsSchema = z.object({
  search: z.string().optional(),
  filter: z.enum(['all', 'mine']).optional().default('all'),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(APP_CONFIG.MAX_POSTS_PER_PAGE).optional().default(APP_CONFIG.POSTS_PER_PAGE),
});

export const profileSchema = z.object({
  username: z
    .string()
    .min(APP_CONFIG.MIN_USERNAME_LENGTH, `Username must be at least ${APP_CONFIG.MIN_USERNAME_LENGTH} characters`)
    .max(APP_CONFIG.MAX_USERNAME_LENGTH, `Username must be ${APP_CONFIG.MAX_USERNAME_LENGTH} characters or less`)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
});

// Action result type
export type ActionResult<T = void> = {
  success: true;
  data: T;
  message?: string;
} | {
  success: false;
  error: string;
  field?: string;
};

// Type exports
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type SearchParamsInput = z.infer<typeof searchParamsSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
