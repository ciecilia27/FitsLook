'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getClientProducts, type Product } from '@/lib/products';

export interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  productIds?: string[];
}

// Pull product ids the stylist cited as [[id]], and strip the markers from text.
function extractProducts(raw: string): { text: string; ids: string[] } {
  const ids: string[] = [];
  const text = raw
    .replace(/\[\[(\d+)\]\]/g, (_, id) => {
      if (!ids.includes(id)) ids.push(id);
      return '';
    })
    .replace(/ {2,}/g, ' ')
    .trim();
  return { text, ids };
}

/**
 * Shared conversation logic for the Fit Assistant. Holds the in-memory
 * message history, loads the signed-in user's profile for personalization,
 * and talks to /api/chat. Used by both the floating widget and the /chat page.
 */
export function useFitAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [catalog, setCatalog] = useState<Product[]>([]);

  // Resolve cited ids → products on the client (respects localStorage edits).
  useEffect(() => {
    setCatalog(getClientProducts());
  }, []);

  // Load the signed-in user's measurements so recommendations are personalized.
  useEffect(() => {
    const email = user?.email;
    if (!email) {
      setProfile(null);
      return;
    }
    fetch(`/api/profile?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setProfile(data);
      })
      .catch(() => {});
  }, [user]);

  const productsById = useCallback(
    (ids?: string[]): Product[] =>
      (ids ?? [])
        .map((id) => catalog.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p)),
    [catalog]
  );

  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const trimmed = (overrideText ?? input).trim();
      if (!trimmed || loading) return;

      const userMsg: Message = { id: Date.now().toString(), role: 'user', text: trimmed };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput('');
      setLoading(true);

      const loadingId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: loadingId, role: 'bot', text: 'Styling recommendations loading...' },
      ]);

      try {
        // Convert UI messages to the API's role format (bot → assistant).
        const apiHistory = nextMessages.map((m) => ({
          role: m.role === 'bot' ? 'assistant' : 'user',
          content: m.text,
        }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiHistory, profile }),
        });
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || 'Request failed');
        }

        const { text, ids } = extractProducts(data.reply || "Sorry, I couldn't process that.");
        setMessages((prev) =>
          prev.map((m) => (m.id === loadingId ? { ...m, text, productIds: ids } : m))
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId ? { ...m, text: 'Connection failed. Please try again.' } : m
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, profile]
  );

  return {
    messages,
    input,
    setInput,
    loading,
    profile,
    sendMessage,
    productsById,
    hasStarted: messages.length > 0,
  };
}
