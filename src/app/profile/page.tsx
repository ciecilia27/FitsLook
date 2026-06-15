'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, CheckCircle, User, Ruler, LogOut, Crown, CreditCard } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getBrowserClient } from '@/lib/supabase';

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const supabase = getBrowserClient();

  const [form, setForm] = useState({
    name: '',
    email: '',
    gender: '',
    height: '',
    weight: '',
    chest: '',
    waist: '',
    hip: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState<{
    plan: string;
    status: string;
    expires_at: string | null;
  } | null>(null);

  // Load profile data from Supabase or localStorage fallback
  useEffect(() => {
    if (authLoading) return;

    // Set email from Supabase user
    if (user?.email) {
      setForm(prev => ({ ...prev, email: user.email! }));
    }

    // Set name from user metadata
    if (user?.user_metadata?.name) {
      setForm(prev => ({ ...prev, name: user.user_metadata.name }));
    }

    // Load profile measurements from Supabase
    async function loadProfile() {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          setForm(prev => ({
            ...prev,
            name: data.name ?? prev.name,
            gender: data.gender ?? prev.gender,
            height: data.height?.toString() ?? prev.height,
            weight: data.weight?.toString() ?? prev.weight,
            chest: data.chest?.toString() ?? prev.chest,
            waist: data.waist?.toString() ?? prev.waist,
            hip: data.hip?.toString() ?? prev.hip,
          }));
        }

        // Load subscription
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('plan, status, expires_at')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (sub) {
          setSubscription(sub);
        }
      }

      // Fallback to localStorage
      try {
        const raw = localStorage.getItem('userProfile');
        if (raw) {
          const p = JSON.parse(raw);
          setForm(prev => ({ ...prev, name: p.name || prev.name }));
        }
      } catch {}
    }

    loadProfile();
  }, [user, authLoading, supabase]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      // Save to Supabase
      if (user?.id) {
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            name: form.name || null,
            email: form.email || null,
            gender: (form.gender as 'male' | 'female' | 'other') || null,
            height: form.height ? parseFloat(form.height) : null,
            weight: form.weight ? parseFloat(form.weight) : null,
            chest: form.chest ? parseFloat(form.chest) : null,
            waist: form.waist ? parseFloat(form.waist) : null,
            hip: form.hip ? parseFloat(form.hip) : null,
          });

        if (upsertError) {
          setError(upsertError.message);
          setSaving(false);
          return;
        }
      }

      // Also save to localStorage as fallback
      localStorage.setItem('userProfile', JSON.stringify(form));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving profile');
    } finally {
      setSaving(false);
    }
  }, [form, user, supabase]);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-12 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-12 space-y-8 animate-in fade-in duration-500">
      {/* Title */}
      <div className="border-b border-gray-150 pb-6">
        <h1 className="text-4xl font-black font-display tracking-tight text-gray-800">EDIT PROFILE</h1>
        <p className="text-gray-400 text-sm mt-0.5">Define your body measurements to calibrate the virtual mirror AI</p>
      </div>

      {/* Subscription Banner */}
      {subscription && (
        <div className="bg-gradient-to-r from-[rgb(var(--accent))]/5 to-purple-50 rounded-3xl p-6 border border-[rgb(var(--accent))]/20 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[rgb(var(--accent))]/15 flex items-center justify-center">
                <Crown className="w-5 h-5 text-[rgb(var(--accent))]" />
              </div>
              <div>
                <span className="block text-sm font-bold text-gray-800 uppercase tracking-wide">
                  {subscription.plan} Plan
                </span>
                <span className="block text-xs text-gray-500">
                  {subscription.status === 'active' ? 'Active' : subscription.status}
                  {subscription.expires_at && ` · Expires ${new Date(subscription.expires_at).toLocaleDateString()}`}
                </span>
              </div>
            </div>
            <button className="btn-outline border-[rgb(var(--accent))]/30 text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent))]/5 py-2 px-4 text-xs tracking-wider uppercase font-bold flex items-center gap-1.5 cursor-pointer">
              <CreditCard className="w-3.5 h-3.5" /> Upgrade
            </button>
          </div>
        </div>
      )}

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 flex items-center gap-3 text-xs font-semibold shadow-sm animate-in slide-in-from-top-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <span>Size parameters calibrated successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: General Info */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-150/80 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-sm text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-[rgb(var(--accent))]" /> Profile Identity
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="form-input"
                placeholder="Name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Email Address</label>
              <input
                type="email"
                value={form.email}
                disabled
                className="form-input bg-gray-50 cursor-not-allowed"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Gender Selection</label>
            <select
              value={form.gender}
              onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
              className="form-input bg-white cursor-pointer"
            >
              <option value="">Choose Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Section 2: Physical Specifications */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-150/80 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-sm text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Ruler className="w-4 h-4 text-[rgb(var(--accent))]" /> Physical Calibration Parameters
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Height (cm)</label>
              <input
                type="number"
                value={form.height}
                onChange={e => setForm(p => ({ ...p, height: e.target.value }))}
                className="form-input"
                placeholder="170"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Weight (kg)</label>
              <input
                type="number"
                value={form.weight}
                onChange={e => setForm(p => ({ ...p, weight: e.target.value }))}
                className="form-input"
                placeholder="65"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4 mt-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Chest (cm)</label>
              <input
                type="number"
                value={form.chest}
                onChange={e => setForm(p => ({ ...p, chest: e.target.value }))}
                className="form-input"
                placeholder="90"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Waist (cm)</label>
              <input
                type="number"
                value={form.waist}
                onChange={e => setForm(p => ({ ...p, waist: e.target.value }))}
                className="form-input"
                placeholder="75"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Hip (cm)</label>
              <input
                type="number"
                value={form.hip}
                onChange={e => setForm(p => ({ ...p, hip: e.target.value }))}
                className="form-input"
                placeholder="95"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button type="submit" disabled={saving} className="flex-1 btn-dark py-4 text-xs tracking-wider uppercase font-bold disabled:opacity-50 shadow-md">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Save Calibrations</>}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="btn-outline border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 py-4 px-6 text-xs tracking-wider uppercase font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Log Out Account
          </button>
        </div>
      </form>
    </div>
  );
}
