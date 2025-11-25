import { createClient } from '@supabase/supabase-js';

// Credentials provided by user
const supabaseUrl = 'https://yxfrtstbxqfebymkspfu.supabase.co';
const supabaseAnonKey = 'sb_publishable_pYHpGY1pWn4qhohhDIKIBA_R0fduUF5';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
