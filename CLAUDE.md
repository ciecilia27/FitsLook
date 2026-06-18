# FitsLook (fit-you-v2) — AI-Powered Virtual Try-On

A Next.js fashion platform that lets users virtually try on clothing from 11 partner brands using AI body scanning, 3D rendering, and real-time camera tracking.

## Stack

- **Framework:** Next.js 16.2.9 (App Router) + React 19.2.7
- **Styling:** Tailwind CSS v4 with CSS variables for theming
- **Backend/Database:** Supabase (auth, profiles, subscriptions, feedback, click tracking)
- **3D/Body:** Three.js 0.184, TensorFlow.js (body-pix, pose-detection)
- **Icons:** lucide-react
- **Language:** TypeScript 5, strict mode
- **Linting:** ESLint 9 (flat config) + eslint-config-next
- **Package Manager:** npm

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (Navbar, Footer, AuthProvider)
│   ├── page.tsx            # Homepage (hero, featured products, reviews)
│   ├── globals.css         # Tailwind v4 imports + custom component classes
│   ├── catalog/            # All products grid
│   ├── brand/[slug]/       # Per-brand product listings
│   ├── product/[id]/       # Product detail + try-on launch
│   ├── tryon/              # Virtual try-on (Three.js camera overlay)
│   ├── body-scan/          # TensorFlow body measurement
│   ├── chat/               # AI chat assistant
│   ├── feedback/           # User reviews form + display
│   ├── profile/            # User profile + measurements
│   ├── signin/ signup/     # Auth pages
│   ├── myfitlook/          # Personalized fit recommendations
│   ├── admin/              # Admin dashboard (analytics charts)
│   └── api/                # API routes (Supabase service role)
│       ├── admin/users/    # User management
│       ├── chat/           # Chat endpoint
│       ├── feedback/       # Feedback submission
│       ├── profile/        # Profile CRUD
│       ├── subscriptions/  # Subscription management
│       └── track-click/    # Shopee click analytics
├── components/
│   ├── Navbar.tsx          # Top nav with auth state
│   ├── Footer.tsx          # Site footer with social links
│   ├── ProductCard.tsx     # Reusable product card
│   └── BrandMarquee.tsx    # Infinite-scroll brand carousel
├── lib/
│   ├── supabase.ts         # Supabase clients (browser, server, admin) + DB types
│   ├── auth-context.tsx    # React context for auth state (client component)
│   ├── brands.ts           # Brand data + localStorage CRUD
│   ├── products.ts         # Product data + localStorage CRUD
│   └── analytics.ts        # Dummy feedback generator + metrics
└── middleware.ts            # Supabase session refresh on every request
```

## Key Conventions

### Supabase Clients (src/lib/supabase.ts)
- **`getBrowserClient()`** — for client components (anon key, RLS enforced)
- **`getServerClient()`** — for server components, reads/writes cookies via `next/headers`
- **`getAdminClient()`** — for API routes, uses service role key (bypasses RLS)
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### AI Chatbot — Fit Assistant (src/app/chat + src/app/api/chat)
- **Provider:** Groq (free tier), OpenAI-compatible `chat/completions` endpoint
- **Model:** `llama-3.3-70b-versatile` (set in `route.ts`; swap to `llama-3.1-8b-instant` for faster/cheaper replies)
- **Env var:** `GROQ_API_KEY` (server-only; never expose to the client). Get a free key at https://console.groq.com
- The API route builds a **system prompt grounded in the live catalog** (`defaultProducts`) + brand vibes, so the bot only recommends real products
- The route accepts `{ messages, profile }` — full conversation history (last 12 turns) plus the signed-in user's measurements for personalized fit advice
- The stylist cites products inline as `[[id]]`; the chat UI strips the markers and renders product cards with **Try On** (uses the `selectedOutfit` localStorage flow) and **Details** buttons
- See `.env.example` for the full env var list

### Auth Flow
- `AuthProvider` (client context) wraps the entire app in `layout.tsx`
- Middleware runs `supabase.auth.getUser()` on every route to refresh the session cookie
- `useAuth()` hook provides `user`, `session`, `loading`, `signOut`, `refreshSession`
- Sign-out also clears `localStorage` keys: `userEmail`, `userRole`, `userProfile`

### Database Schema (supabase-schema.sql)
- **profiles** — user body measurements (height, weight, chest, waist, hip) + gender
- **subscriptions** — plan tiers: free / pro / premium
- **shopee_clicks** — affiliate link click tracking
- **feedback** — user ratings (1-5) + messages
- RLS: profiles, shopee_clicks, feedback allow anon insert/read; subscriptions restricted to auth.uid()

### Data Pattern
- Brands and products are stored in TypeScript files (`brands.ts`, `products.ts`) and synced to `localStorage`
- `getClientBrands()` / `getClientProducts()` check for stored data, fall back to defaults
- Admin panel can edit these via localStorage, not the database

### Styling (Tailwind v4 + CSS Variables)
- CSS variables in `:root`: `--accent` (warm taupe `141 122 116`), `--bg`, `--fg`, `--muted`, `--surface`
- Custom component classes in `@layer components`: `.btn-primary`, `.btn-dark`, `.btn-outline`, `.card`, `.glass-card`, `.nav-link`, `.form-input`, `.marquee-wrapper`, `.scanner-line`, `.shimmer`
- Fonts: Inter (body), Outfit (headings)
- Colors referenced as `rgb(var(--accent))` in Tailwind arbitrary values

### 11 Partner Brands
Evara, UNIT, Reapin, Luna Luv, Angelique Attire, Cozy Cults, Dandels, Imperia Culverin, Wear On Street, Madfo.U, and one more. Product images live in `public/images/<Brand Name>/`.

### Product Types
Each product has: `id`, `name`, `brand`, `image`, `type` (top/bottom), `fit` array (slim/athletic/regular/relaxed/hourglass/full), optional `shopeeUrl`, `price`, `description`.

## Commands

```bash
npm run dev       # Start dev server on :3000
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint
```

## Important: Next.js 16 Breaking Changes

This project uses Next.js **16.2.9** which has breaking changes from earlier versions. Always check `node_modules/next/dist/docs/` for API references before writing Next.js-specific code. Key differences from Next.js 14/15:
- `cookies()` from `next/headers` is now async — must be awaited
- App Router page params are now async (e.g., `{ params: Promise<{ slug: string }> }`)
- Tailwind v4 uses CSS-first config (no `tailwind.config.js`), imports via `@import "tailwindcss"`

## File Naming
- Pages in `src/app/` use `page.tsx` (Next.js convention)
- API routes in `src/app/api/` use `route.ts`
- Components use PascalCase with `.tsx` extension
- Library utilities use kebab-case or camelCase with `.ts` extension
- Brand/product images in `public/images/<Brand Name>/` — spaces in brand folder names are intentional

## Build/Deploy
- Designed for Vercel deployment
- No special `next.config.ts` configuration needed currently
- Supabase environment variables must be set in deployment platform