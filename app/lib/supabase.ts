import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://zugvpxletlutlekskfpk.supabase.co"; 
// ⚠️↓ここを、プロデューサーの本物のANON_KEYに書き換えてください
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1Z3ZweGxldGx1dGxla3NrZnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4Mjc5NjQsImV4cCI6MjEwNDQwMzk2NH0.qhDqujGh7lClpsfAKdEeFpXpZG0VbKrvgs2j-ZGXiy8";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // 【修正】キャッシュの暴走による401エラーを防ぐためオフに変更
    autoRefreshToken: false,
  }
});