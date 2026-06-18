'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Send, Bot, User, Loader2, MessageSquare, X, Sparkles } from 'lucide-react';
import { useFitAssistant } from './fit-assistant/useFitAssistant';
import MiniProductCard from './fit-assistant/MiniProductCard';

const suggestedPrompts = [
  'What should I wear to a dinner date?',
  'Build me a casual weekend outfit.',
  'Show me relaxed streetwear from Reapin.',
];

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { messages, input, setInput, loading, profile, sendMessage, productsById, hasStarted } =
    useFitAssistant();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // The dedicated /chat page already hosts the full assistant — no widget there.
  if (pathname === '/chat') return null;

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close stylist chat' : 'Open stylist chat'}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-[rgb(var(--fg))] text-white flex items-center justify-center shadow-xl hover:brightness-110 active:scale-95 transition-all duration-300 cursor-pointer"
      >
        {open ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[min(92vw,380px)] h-[min(75vh,560px)] flex flex-col bg-white rounded-3xl shadow-2xl border border-gray-150 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-150 bg-[rgb(var(--fg))] text-white">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-sm leading-tight">Fit Assistant</h3>
              <p className="text-[10px] text-white/60">
                {profile ? 'Personalized to your measurements' : 'Your AI stylist'}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3.5 scrollbar-thin bg-gray-50/50">
            {!hasStarted && (
              <div className="text-center py-6 px-3">
                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))] rounded-full">
                  <Bot className="w-5 h-5" />
                </div>
                <h4 className="font-display font-bold text-gray-800 text-sm mb-1">Hi, I&apos;m your stylist</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
                  Tell me the occasion or vibe and I&apos;ll put together a look you can try on.
                </p>
                <div className="flex flex-col gap-1.5">
                  {suggestedPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      className="px-3 py-2 rounded-xl bg-white border border-gray-150 text-[11px] font-semibold text-gray-600 hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--fg))] transition text-left cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500 flex-shrink-0" /> {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-[rgb(var(--accent))] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : ''}`}>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-[11px] leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-[rgb(var(--fg))] text-white rounded-tr-sm'
                        : 'bg-white border border-gray-150 rounded-tl-sm text-gray-700'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  {productsById(msg.productIds).map((p) => (
                    <MiniProductCard key={p.id} product={p} />
                  ))}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-gray-150 bg-white">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask for an outfit..."
              className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]/20 focus:border-[rgb(var(--accent))] text-[11px] bg-white font-medium"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-full bg-[rgb(var(--fg))] text-white flex items-center justify-center disabled:opacity-50 hover:brightness-110 active:scale-95 transition cursor-pointer flex-shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
