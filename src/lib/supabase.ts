import { createClient } from '@supabase/supabase-js';

const getInitialClient = () => {
  const savedUrl = localStorage.getItem('oxygen_supabase_url');
  const savedKey = localStorage.getItem('oxygen_supabase_anon_key');
  
  // Hardcoded defaults for automatic connection
  const DEFAULT_URL = 'https://iseiirekrqiipixunumn.supabase.co';
  const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZWlpcmVrcnFpaXBpeHVudW1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MzQ5MDksImV4cCI6MjA5OTQxMDkwOX0.VfWxNs18FMFYnHiWwplajyDcFDth2SVNvhYEZmMv3M0';

  // Use VITE_ prefix variables from env as fallback, then hardcoded defaults
  const url = savedUrl || (import.meta as any).env.VITE_SUPABASE_URL || DEFAULT_URL;
  const key = savedKey || (import.meta as any).env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;
  
  if (url && key) {
    try {
      return createClient(url, key);
    } catch (e) {
      console.error('Failed to init Supabase client:', e);
    }
  }
  return null;
};

export let supabase = getInitialClient();

export const updateSupabaseCredentials = (url: string, key: string) => {
  if (url && key) {
    localStorage.setItem('oxygen_supabase_url', url);
    localStorage.setItem('oxygen_supabase_anon_key', key);
    try {
      supabase = createClient(url, key);
    } catch (e) {
      console.error('Failed to update Supabase client:', e);
      supabase = null;
    }
  } else {
    localStorage.removeItem('oxygen_supabase_url');
    localStorage.removeItem('oxygen_supabase_anon_key');
    supabase = null;
  }
  return supabase;
};
