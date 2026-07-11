import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';
import { getRole } from '@/lib/roles';

// OAuth (Google) redirects back here with a `code`.
// We exchange it for a session cookie, then send the user on their way.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await getServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const role = getRole(data.user.email);
      const dest = role === 'admin' ? '/admin' : '/myfitlook';
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  // Something went wrong — back to sign in.
  return NextResponse.redirect(`${origin}/signin?error=oauth`);
}
