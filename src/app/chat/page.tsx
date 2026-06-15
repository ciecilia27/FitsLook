'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

const suggestedPrompts = [
  "What styles fit a Pear body type?",
  "Recommend me structured formal tops.",
  "How does virtual mirror calibration work?",
  "Recommend relaxed items from Reapin."
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const sendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: loadingId, role: 'bot', text: 'Styling recommendations loading...' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that.";

      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, text: reply } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, text: 'Connection failed. Try submitting again.' } : m));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-5 py-10 flex flex-col h-[calc(100vh-140px)]">
      {/* Title */}
      <div className="mb-6 flex items-center justify-between border-b border-gray-150 pb-4">
        <div>
          <h1 className="text-3xl font-black font-display tracking-tight text-gray-800">FIT ASSISTANT</h1>
          <p className="text-gray-400 text-xs mt-0.5">Your personal virtual stylist powered by AI</p>
        </div>
        <div className="p-2 bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))] rounded-xl">
          <MessageSquare className="w-5 h-5" />
        </div>
      </div>

      {/* Chat Messages */}
      <div ref={chatBoxRef} className="flex-1 overflow-y-auto space-y-4 pb-6 pr-1.5 scrollbar-thin">
        {messages.length === 0 && (
          <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm max-w-md mx-auto my-auto animate-in fade-in duration-500">
            <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))] rounded-full">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-gray-800 mb-1">Start Styling Session</h3>
            <p className="text-xs text-gray-400 leading-relaxed px-4">
              Ask queries about fashion coordinates, sizing calibrations, or matching wardrobes.
            </p>
          </div>
        )}
        
        {messages.map(msg => (
          <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-[rgb(var(--accent))] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <Bot className="w-4.5 h-4.5 text-white" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm transition-all duration-300 ${
              msg.role === 'user'
                ? 'bg-[rgb(var(--fg))] text-white rounded-tr-sm'
                : 'bg-white border border-gray-150 rounded-tl-sm text-gray-700'
            }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <User className="w-4 h-4 text-gray-500" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Suggested prompts list */}
      {messages.length === 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-100" /> Suggested styling questions
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map(p => (
              <button
                key={p}
                onClick={() => handlePromptClick(p)}
                className="px-3.5 py-2 rounded-xl bg-white border border-gray-150 text-[10px] font-bold text-gray-500 hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--fg))] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer shadow-sm"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input container */}
      <div className="flex gap-2 pt-4 border-t border-gray-150 bg-transparent">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Query sizing details, coordinates..."
          className="flex-1 px-5 py-3.5 rounded-full border border-gray-200 focus:outline-none focus:ring-4 focus:ring-[rgb(var(--accent))]/15 focus:border-[rgb(var(--accent))] text-xs bg-white shadow-sm font-medium"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="w-12 h-12 rounded-full bg-[rgb(var(--fg))] text-white flex items-center justify-center disabled:opacity-50 hover:brightness-110 active:scale-95 transition-all duration-300 shadow-md cursor-pointer"
        >
          {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Send className="w-4.5 h-4.5" />}
        </button>
      </div>
    </div>
  );
}
