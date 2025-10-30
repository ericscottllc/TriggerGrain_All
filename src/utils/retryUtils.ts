import { supabase } from '../lib/supabase';

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export async function retryWithAuth<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    shouldRetry = (error) => isAuthError(error) || isNetworkError(error),
    onRetry,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0 && onRetry) {
        onRetry(attempt, lastError);
      }

      if (attempt > 0) {
        console.log(`[retryWithAuth] Attempt ${attempt + 1}/${maxRetries + 1}`);

        const delay = Math.min(delayMs * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      if (attempt > 0) {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          console.log('[retryWithAuth] Session invalid, attempting refresh...');
          const { data: { session: refreshedSession }, error: refreshError } =
            await supabase.auth.refreshSession();

          if (refreshError || !refreshedSession) {
            console.error('[retryWithAuth] Failed to refresh session:', refreshError);
            throw refreshError || new Error('Session refresh failed');
          }

          console.log('[retryWithAuth] Session refreshed successfully');
        }
      }

      return await fn();
    } catch (error) {
      lastError = error;
      console.error(`[retryWithAuth] Attempt ${attempt + 1} failed:`, error);

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}

function isAuthError(error: any): boolean {
  if (!error) return false;

  const message = error.message || error.msg || '';
  const code = error.code || '';

  const authErrorCodes = [
    'PGRST301',
    'PGRST302',
    '401',
    'invalid_jwt',
    'session_not_found',
    'refresh_token_not_found',
  ];

  const authErrorMessages = [
    'jwt expired',
    'jwt malformed',
    'invalid token',
    'session not found',
    'unauthorized',
    'not authenticated',
  ];

  return (
    authErrorCodes.some(c => code.includes(c)) ||
    authErrorMessages.some(m => message.toLowerCase().includes(m))
  );
}

function isNetworkError(error: any): boolean {
  if (!error) return false;

  const message = error.message || error.msg || '';

  const networkErrorMessages = [
    'network',
    'fetch',
    'timeout',
    'connection',
    'offline',
  ];

  return networkErrorMessages.some(m => message.toLowerCase().includes(m));
}

export async function withAuthRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
  try {
    return await retryWithAuth(queryFn, {
      ...options,
      onRetry: (attempt, error) => {
        console.log(`[withAuthRetry] Retrying query (attempt ${attempt}):`, error);
        if (options.onRetry) {
          options.onRetry(attempt, error);
        }
      },
    });
  } catch (error) {
    console.error('[withAuthRetry] All retry attempts failed:', error);
    return { data: null, error };
  }
}
