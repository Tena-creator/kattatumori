import { createClient } from '@supabase/supabase-js';

// ▼ 空っぽの場合はダミーの文字列を入れてビルドエラーを防ぐ！
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);