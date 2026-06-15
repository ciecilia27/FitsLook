'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, User, ShieldAlert, Loader2 } from 'lucide-react';
import { getBrowserClient } from '@/lib/supabase';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = getBrowserClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Store fallback values for components that still use localStorage
    const role = email.toLowerCase().includes('admin') ? 'admin' : 'user';
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userRole', role);

    if (role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/myfitlook';
    }
  };

  const handleQuickLogin = async (role: 'user' | 'admin') => {
    const defaultEmail = role === 'admin' ? 'admin@fitlook.com' : 'user@fitlook.com';
    const defaultPassword = role === 'admin' ? 'Admin123!' : 'User123!';

    setLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: defaultEmail,
      password: defaultPassword,
    });

    if (signInError) {
      // Fallback to localStorage for prototype mode
      localStorage.setItem('userEmail', defaultEmail);
      localStorage.setItem('userRole', role);
      if (role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/myfitlook';
      }
      return;
    }

    localStorage.setItem('userEmail', defaultEmail);
    localStorage.setItem('userRole', role);

    if (role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/myfitlook';
    }
  };

  return (
    <div className="max-w-md mx-auto px-5 py-16 animate-in fade-in duration-500 space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-black font-display tracking-tight text-gray-800">SIGN IN</h1>
        <p className="text-gray-400 text-xs mt-1">Access your saved body metrics and personalized fits</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSignIn} className="bg-white rounded-3xl p-6 md:p-8 border border-gray-150/80 shadow-sm space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="form-input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="form-input"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-dark w-full py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogIn className="w-4 h-4" /> Sign In</>}
        </button>
      </form>

      {/* Quick Login Dummy Buttons */}
      <div className="bg-white rounded-3xl p-6 border border-gray-150/80 shadow-sm space-y-3">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">
          Prototype Quick Logins
        </span>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleQuickLogin('user')}
            disabled={loading}
            className="py-3 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:border-[rgb(var(--accent))] hover:bg-gray-50/50 transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <User className="w-3.5 h-3.5" /> Log in as User
          </button>
          <button
            onClick={() => handleQuickLogin('admin')}
            disabled={loading}
            className="py-3 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:border-red-400 hover:bg-red-50/20 transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Log in as Admin
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-[rgb(var(--accent))] font-bold hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
