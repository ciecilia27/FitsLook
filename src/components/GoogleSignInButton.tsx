'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getBrowserClient } from '@/lib/supabase';

export default function GoogleSignInButton({ label = 'Continue with Google' }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const supabase = getBrowserClient();

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    // On success the browser is redirected to Google, so we only reach here on error.
    if (error) setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={loading}
      className="w-full py-3.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:border-[rgb(var(--accent))] hover:bg-gray-50/50 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
            <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
