'use client';

import { useState } from 'react';
import { Send, Star, CheckCircle, Loader2 } from 'lucide-react';

export default function FeedbackPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '', rating: 5 });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to submit feedback');
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-5 py-20 text-center animate-in fade-in duration-500">
        <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-emerald-50 rounded-full border border-emerald-100">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-black font-display text-gray-800 mb-2">Thank You!</h1>
        <p className="text-sm text-gray-400 max-w-xs mx-auto mb-8 leading-relaxed">
          Your details have been submitted. We appreciate your feedback to improve FIT LOOK.
        </p>
        <a href="/" className="btn-dark px-8 py-3 text-xs font-bold uppercase tracking-wider shadow-md">
          Back to Home
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-12 space-y-8 animate-in fade-in duration-500">
      {/* Title */}
      <div className="border-b border-gray-150 pb-6 text-center md:text-left">
        <h1 className="text-4xl font-black font-display tracking-tight text-gray-800">FEEDBACK</h1>
        <p className="text-gray-400 text-sm mt-0.5">Let us know how your virtual mirror calibration experience went</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 border border-gray-150/80 shadow-sm space-y-5">
        {/* Rating */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Mirror Calibration Rating</label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setForm(p => ({ ...p, rating: n }))}
                className="p-1 cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95"
                title={`${n} Stars`}
              >
                <Star
                  className={`w-7 h-7 transition-colors duration-300 ${
                    n <= form.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

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
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="form-input"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Your Experience Message</label>
          <textarea
            value={form.message}
            onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
            rows={5}
            required
            className="form-input resize-none h-[120px]"
            placeholder="Share your thoughts on body scans or outfit fit alignment..."
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
        )}

        <button type="submit" disabled={saving || !form.message.trim()} className="btn-dark w-full py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Feedback</>}
        </button>
      </form>
    </div>
  );
}
