// Falls back to the values Figma Make generated so local dev keeps working
// out of the box; set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY as Netlify
// (or other host) environment variables to override per environment.
export const projectId =
  (import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined) ?? "kknhbddqipxbtffwyfbe";

export const publicAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrbmhiZGRxaXB4YnRmZnd5ZmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDU0MTcsImV4cCI6MjA3NzIyMTQxN30.gSU6DwOoQZ4nFpwMhV4j0busntDU8U3huQWTZ5XopaE";
