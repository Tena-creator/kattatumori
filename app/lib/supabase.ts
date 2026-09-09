import { createClient } from '@supabase/supabase-js';

// Cloudflareの罠を回避するため、URLとキーを直接書きます
// （.trim() をつけることで、コピペ時の見えない空白エラーを防ぎます）
const supabaseUrl = "https://zugvpxletlutlekskfpk.supabase.co".trim();
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1Z3ZweGxldGx1dGxla3NrZnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4Mjc5NjQsImV4cCI6MjEwNDQwMzk2NH0.qhDqujGh7lClpsfAKdEeFpXpZG0VbKrvgs2j-ZGXiy8".trim();

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // 【最重要】ブラウザに残った過去のエラーキャッシュ（ゴミ）を無視してアクセス拒否(401)を防ぐ
    persistSession: false,
    autoRefreshToken: false,
  }
});