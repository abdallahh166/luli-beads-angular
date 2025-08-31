import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

// Prefer environment variables, fallback to existing values for safety
const FALLBACK_SUPABASE_URL = "https://usafiyvkyzqulznzjvod.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzYWZpeXZreXpxdWx6bnpqdm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTY1NjEsImV4cCI6MjA3MjIzMjU2MX0.FXgvXotcciH1CUuMX8gw_wVMelzV16VT6uN2dnWD15A";

const SUPABASE_URL = environment.supabase.url || FALLBACK_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = environment.supabase.anonKey || FALLBACK_SUPABASE_ANON_KEY;

// Safe storage check (works only in browser)
const storage = typeof window !== 'undefined' ? window.localStorage : undefined;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
