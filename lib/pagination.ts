import { PaginationCursor } from '@/types/post';

export const encodeCursor = (cursor: PaginationCursor): string => {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
};

export const decodeCursor = (cursor: string): PaginationCursor => {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
  } catch (error) {
    throw new Error('Invalid cursor format');
  }
};

export const createCursor = (created_at: string, id: string): string => {
  return encodeCursor({ created_at, id });
};

export const parseCursor = (cursor?: string): PaginationCursor | null => {
  if (!cursor) return null;
  
  try {
    return decodeCursor(cursor);
  } catch {
    return null;
  }
};

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;
