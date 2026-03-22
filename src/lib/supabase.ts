import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ncorhljyltvnovyzwqgb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb3JobGp5bHR2bm92eXp3cWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNTk5NTUsImV4cCI6MjA4OTczNTk1NX0.fKhhyc6GUk8ikzvHp2kU3B_M0KX6vYMDWWK8imB34-E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
