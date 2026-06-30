import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kgvnllmxhepbrzwovrjb.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtndm5sbG14aGVwYnJ6d292cmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MDgyOTYsImV4cCI6MjA5ODI4NDI5Nn0.6K4H4aP7F-g7hgc194_COmSF-yi6k4xwXjfcB3QpNu0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
  },
})
