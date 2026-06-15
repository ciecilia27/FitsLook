'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Loader2 } from 'lucide-react';
import { getBrowserClient } from '@/lib/supabase';

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = getBrowserClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          role: 'user',
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Store fallback values
    localStorage.setItem('userProfile', JSON.stringify({ name: form.name, email: form.email }));
    localStorage.setItem('userEmail', form.email);
    localStorage.setItem('userRole', 'user');

    // If email confirmation is required, redirect to a confirmation page
    if (data.user && !data.session) {
      setError('Check your email to confirm your account. You can still browse the site.');
      setLoading(false);
      return;
    }

    window.location.href = '/profile';
  };

  return (
    <div className="max-w-md mx-auto px-5 py-20 animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black font-display tracking-tight text-gray-800">CREATE ACCOUNT</h1>
        <p className="text-gray-400 text-xs mt-1">Calibrate your AI body scan results and unlock virtual fits</p>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-semibold mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSignUp} className="bg-white rounded-3xl p-6 md:p-8 border border-gray-150/80 shadow-sm space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Full Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            required
            className="form-input"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Email Address</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            required
            className="form-input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            required
            minLength={6}
            className="form-input"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-dark w-full py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md pt-3 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Create Account</>}
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-6">
        Already have an account?{' '}
        <Link href="/signin" className="text-[rgb(var(--accent))] font-bold hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}
