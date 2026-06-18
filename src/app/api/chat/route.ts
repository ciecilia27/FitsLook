import { NextRequest, NextResponse } from 'next/server';
import { defaultProducts } from '@/lib/products';
import { defaultBrands } from '@/lib/brands';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ProfileInput {
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  chest?: number | null;
  waist?: number | null;
  hip?: number | null;
}

// Map body measurements to the fit vocabulary the catalog uses.
function deriveFitHint(p?: ProfileInput | null): string {
  if (!p || (!p.chest && !p.waist && !p.hip)) return '';
  const chest = p.chest ?? 0;
  const waist = p.waist ?? 0;
  const hip = p.hip ?? 0;

  const hints: string[] = [];
  if (hip && chest && hip - chest >= 6) hints.push('hourglass/relaxed bottoms suit them');
  if (chest && waist && chest - waist >= 15) hints.push('athletic/slim tops suit them');
  if (waist && hip && waist >= hip - 2) hints.push('regular/relaxed fits are most comfortable');
  return hints.length ? `Fit guidance: ${hints.join('; ')}.` : '';
}

function buildSystemPrompt(profile?: ProfileInput | null): string {
  const catalog = defaultProducts
    .map(
      (p) =>
        `id=${p.id} | ${p.name} | ${p.brand} | ${p.type} | fit: ${p.fit.join(',')}`
    )
    .join('\n');

  const brandVibes = defaultBrands
    .map((b) => `- ${b.name}: ${b.description}`)
    .join('\n');

  let profileBlock = 'The user has not shared body measurements yet.';
  if (profile && (profile.height || profile.chest || profile.waist || profile.hip)) {
    profileBlock = [
      'The signed-in user shared these measurements (cm/kg):',
      profile.gender ? `- Gender: ${profile.gender}` : '',
      profile.height ? `- Height: ${profile.height}` : '',
      profile.weight ? `- Weight: ${profile.weight}` : '',
      profile.chest ? `- Chest: ${profile.chest}` : '',
      profile.waist ? `- Waist: ${profile.waist}` : '',
      profile.hip ? `- Hip: ${profile.hip}` : '',
      deriveFitHint(profile),
    ]
      .filter(Boolean)
      .join('\n');
  }

  return `You are "Fit Assistant", the personal AI stylist for FitsLook, a virtual try-on fashion platform.

Your job: have a friendly, natural conversation and recommend outfits to the user. You can recommend complete looks (pair a top with a bottom), suggest items for an occasion or vibe, match items to the user's body type, and explain why something fits.

STRICT RULES:
- ONLY recommend products from the CATALOG below. Never invent products, brands, prices, or product ids.
- When you recommend a specific product, cite it inline using its id in double square brackets right after the name, e.g. "the Orca Shirt [[5]]". Only cite ids that exist in the catalog.
- Prefer recommending a coordinated outfit (one top + one bottom) when the user asks for an outfit or look. The catalog is top-heavy, so if no matching bottom exists, recommend tops and mention that bottoms are limited.
- Use the fit vocabulary: slim, athletic, regular, relaxed, hourglass, full. Match products whose "fit" tags suit the user's body and request.
- Keep replies concise (2-4 short paragraphs max), warm, and stylist-like. Do not use markdown headers.

FIT VOCABULARY MEANING:
- slim/athletic: closer to the body, structured
- regular: standard everyday fit
- relaxed/full: roomier, oversized comfort
- hourglass: shaped for a defined waist

USER PROFILE:
${profileBlock}

BRAND VIBES:
${brandVibes}

CATALOG (${defaultProducts.length} items):
${catalog}`;
}

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Chat is not configured. Set GROQ_API_KEY in the environment.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    // Accept either a single { message } (legacy) or full { messages } history.
    const history: ChatMessage[] = Array.isArray(body.messages)
      ? body.messages
      : body.message
        ? [{ role: 'user', content: String(body.message) }]
        : [];

    if (history.length === 0) {
      return NextResponse.json({ error: 'No message provided.' }, { status: 400 });
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: buildSystemPrompt(body.profile) },
      ...history.slice(-12), // keep recent turns to stay within free-tier limits
    ];

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 700,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: `Stylist is busy right now (Groq ${res.status}).`, detail },
        { status: 502 }
      );
    }

    const data = await res.json();
    const reply: string =
      data.choices?.[0]?.message?.content ?? "Sorry, I couldn't style that one.";

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
