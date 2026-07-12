import { getServerClient } from '@/lib/supabase';
import { getRole } from '@/lib/roles';

// Server-side admin check for API routes. Reads the Supabase session cookie
// and verifies the authenticated user's email against the admin role.
// Returns null when the caller is an admin, or an error payload otherwise.
export async function requireAdmin(): Promise<{ error: string; status: number } | null> {
  const supabase = await getServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: 'Not authenticated', status: 401 };
  }
  if (getRole(user.email) !== 'admin') {
    return { error: 'Admin access required', status: 403 };
  }
  return null;
}
