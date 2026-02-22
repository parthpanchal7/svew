import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://rlepsimezrfpcpbejyce.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZXBzaW1lenJmcGNwYmVqeWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MzM5MjEsImV4cCI6MjA4NzMwOTkyMX0.SANwCVFmXoP0y70k89djoY0tW2_H9kgDRsMyDyNUNpY"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)