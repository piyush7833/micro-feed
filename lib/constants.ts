export const ERROR_MESSAGES = {
  INVALID_INPUT: 'Invalid input provided',
  UNAUTHORIZED: 'You must be signed in to perform this action',
  USER_NOT_FOUND: 'User profile not found',
  USERNAME_TAKEN: 'Username is already taken',
  UNKNOWN_ERROR: 'An unexpected error occurred',
  NETWORK_ERROR: 'Network error, please try again',
  EMAIL_NOT_CONFIRMED: 'Please check your email and confirm your account',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_NOT_FOUND: 'No account found with this email address',
  WEAK_PASSWORD: 'Password should be at least 6 characters',
} as const;

export const SUCCESS_MESSAGES = {
  SIGNUP_SUCCESS: 'Account created successfully!',
  SIGNIN_SUCCESS: 'Welcome back!',
  SIGNOUT_SUCCESS: 'Signed out successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  POST_CREATED: 'Post created successfully',
  POST_UPDATED: 'Post updated successfully',
  POST_DELETED: 'Post deleted successfully',
} as const;

export const APP_CONFIG = {
  MAX_POST_LENGTH: 280,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 30,
  POSTS_PER_PAGE: 10,
  MAX_POSTS_PER_PAGE: 50,
} as const;
