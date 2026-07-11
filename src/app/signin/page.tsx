'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import GoogleSignInButton from '@/components/GoogleSignInButton';

function SignInContent() {
  const searchParams = useSearchParams();
  const hasError = searchParams.get('error') === 'oauth';

  return (
    <div className="max-w-md mx-auto px-5 py-24 animate-in fade-in duration-500 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-black font-display tracking-tight text-gray-800">WELCOME</h1>
        <p className="text-gray-400 text-xs mt-2">
          Sign in to save your body metrics and unlock personalized fits
        </p>
      </div>

      {hasError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          Something went wrong signing in. Please try again.
        </div>
      )}

      <div className="bg-white rounded-3xl p-8 border border-gray-150/80 shadow-sm">
        <GoogleSignInButton label="Continue with Google" />
        <p className="text-center text-[11px] text-gray-400 mt-5 leading-relaxed">
          New here? Continuing with Google creates your account automatically.
        </p>
      </div>

      <p className="text-center text-[11px] text-gray-300">
        By continuing you agree to our Terms and Privacy Policy.
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  );
}
