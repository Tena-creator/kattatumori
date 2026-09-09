import { createClient } from '@supabase/supabase-js';

// Cloudflareの罠を無視！公開しても安全なURLとANON_KEYを直接書く力技
const supabaseUrl = "https://zugvpxletlutlekskfpk.supabase.co"; 
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1Z3ZweGxldGx1dGxla3NrZnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4Mjc5NjQsImV4cCI6MjEwNDQwMzk2NH0.qhDqujGh7lClpsfAKdEeFpXpZG0VbKrvgs2j-ZGXiy8";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});