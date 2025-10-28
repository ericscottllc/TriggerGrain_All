import { supabase } from '../lib/supabase';

export async function rpcWithRetry<T = any>(
  functionName: string,
  params: Record<string, any> = {},
  maxRetries: number = 2
): Promise<{ data: T | null; error: any }> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[rpcWithRetry] Calling ${functionName} (attempt ${attempt + 1}/${maxRetries + 1})`);

      const { data, error } = await supabase.rpc(functionName, params);

      if (error) {
        console.error(`[rpcWithRetry] Error on attempt ${attempt + 1}:`, error);
        lastError = error;

        if (error.code === 'PGRST202' || error.message?.includes('function') || error.message?.includes('schema cache')) {
          console.log('[rpcWithRetry] Function not found error, will not retry');
          return { data: null, error };
        }

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 3000);
          console.log(`[rpcWithRetry] Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      console.log(`[rpcWithRetry] Success on attempt ${attempt + 1}`);
      return { data, error: null };
    } catch (exception) {
      console.error(`[rpcWithRetry] Exception on attempt ${attempt + 1}:`, exception);
      lastError = exception;

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 3000);
        console.log(`[rpcWithRetry] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  console.error(`[rpcWithRetry] All retry attempts failed for ${functionName}`);
  return { data: null, error: lastError };
}

export async function ensureValidSession(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[ensureValidSession] Error getting session:', error);
      return false;
    }

    if (!session) {
      console.log('[ensureValidSession] No active session found');
      return false;
    }

    console.log('[ensureValidSession] Valid session found');
    return true;
  } catch (exception) {
    console.error('[ensureValidSession] Exception checking session:', exception);
    return false;
  }
}

export async function refreshSessionIfNeeded(): Promise<void> {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('[refreshSessionIfNeeded] Error refreshing session:', error);
      return;
    }

    if (data.session) {
      console.log('[refreshSessionIfNeeded] Session refreshed successfully');
    }
  } catch (exception) {
    console.error('[refreshSessionIfNeeded] Exception refreshing session:', exception);
  }
}
