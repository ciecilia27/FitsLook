import { redirect } from 'next/navigation';

// Auth is Google-only and there's no separate registration step — the first
// Google sign-in creates the account. Keep this route as a permanent redirect
// so old links and bookmarks still land on the auth screen.
export default function SignUpPage() {
  redirect('/signin');
}
