import { createClient, SupabaseClient } from '@supabase/supabase-js';

function sanitizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim().replace(/^["']|["']$/g, '');
  if (!url) return '';

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    // Base URL must strictly be origin (e.g., https://xyz.supabase.co) without /auth/v1 or /rest/v1
    return parsed.origin;
  } catch {
    return url.replace(/(\/(auth|rest|storage)\/v1|\/v1|\/+)*$/gi, '');
  }
}

const rawSupabaseUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || '';
const rawSupabaseAnonKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || '';

const supabaseUrl = sanitizeSupabaseUrl(rawSupabaseUrl);
const supabaseAnonKey = rawSupabaseAnonKey.trim().replace(/^["']|["']$/g, '');

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'MY_SUPABASE_URL' && 
  supabaseAnonKey !== 'MY_SUPABASE_ANON_KEY' &&
  (supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://'))
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const BUCKET_NAME = 'studyvault-files';
