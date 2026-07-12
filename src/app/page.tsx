'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import BrandMarquee from '@/components/BrandMarquee';
import { getFeaturedProducts } from '@/lib/products';
import Link from 'next/link';
import { ArrowRight, Scan, Shirt, Sparkles, Star } from 'lucide-react';
import { Feedback } from '@/lib/analytics';

const bodyTags = ['Hourglass Fit', 'Athletic Silhouette', 'Regular Fit', 'Slim Proportions', 'Relaxed Frame', 'Tall & Lean'];
const roles = ['Verified Buyer', 'Fashion Enthusiast', 'Style Critic', 'Fit Explorer', 'Trend Follower'];

export default function Home() {
  const featured = getFeaturedProducts(10);
  
  const [mounted, setMounted] = useState(false);
  const [reviews, setReviews] = useState<Feedback[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/feedback')
      .then(res => res.ok ? res.json() : [])
      .then((list: Feedback[]) => {
        if (!Array.isArray(list)) return;
        // Filter for 4 and 5 star ratings only
        const filtered = list.filter(r => r.rating === 4 || r.rating === 5);
        // Shuffle randomly on load
        setReviews([...filtered].sort(() => Math.random() - 0.5));
      })
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoaded(true));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-5 py-8 md:py-16 space-y-16 animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 py-6">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))] rounded-full text-xs font-bold uppercase tracking-wider">
            <Star className="w-3.5 h-3.5 fill-[rgb(var(--accent))]" />
            <span>AI-Powered Try-On Mirror</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gray-900 leading-none">
            FIND YOUR <br className="hidden md:inline" />
            <span className="text-[rgb(var(--accent))] font-display italic font-light">PERFECT</span> FIT
          </h1>
          
          <p className="text-gray-400 text-sm md:text-base max-w-lg leading-relaxed">
            MirrorMe Technology: Calibrate your physical metrics in 3D and project outfits directly onto your body with real-time camera tracking.
          </p>
          
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <Link href="/body-scan" className="btn-dark px-8 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg">
              <Scan className="w-4.5 h-4.5" /> Start Body Scan
            </Link>
            <Link href="/catalog" className="btn-outline px-8 py-3.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1 border-gray-300 text-gray-700 hover:bg-gray-50">
              Browse Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Hero Visual Block */}
        <div className="flex-1 w-full max-w-md lg:max-w-none grid grid-cols-2 gap-4 relative">
          <div className="space-y-4">
            <div className="bg-white rounded-3xl aspect-[3/4] overflow-hidden border border-gray-150/80 shadow-sm p-4 flex items-center justify-center relative">
              <img src="/images/Evara/Forme_Vest_Gray-removebg-preview.png" alt="Featured Vest" className="max-h-full object-contain" />
              <span className="absolute bottom-3 right-3 px-2 py-0.5 text-[8px] font-bold bg-gray-50 border border-gray-100 rounded-full text-gray-500 uppercase tracking-widest">Evara</span>
            </div>
            <div className="bg-white rounded-3xl aspect-square overflow-hidden border border-gray-150/80 shadow-sm p-4 flex items-center justify-center relative">
              <img src="/images/Unit/Orca_UNIT-removebg-preview.png" alt="Featured Shirt" className="max-h-full object-contain" />
              <span className="absolute bottom-3 right-3 px-2 py-0.5 text-[8px] font-bold bg-gray-50 border border-gray-100 rounded-full text-gray-500 uppercase tracking-widest">UNIT</span>
            </div>
          </div>
          <div className="space-y-4 pt-8">
            <div className="bg-white rounded-3xl aspect-square overflow-hidden border border-gray-150/80 shadow-sm p-4 flex items-center justify-center relative">
              <img src="/images/Evara/Lea Top in White.png" alt="Featured Top" className="max-h-full object-contain" />
              <span className="absolute bottom-3 right-3 px-2 py-0.5 text-[8px] font-bold bg-gray-50 border border-gray-100 rounded-full text-gray-500 uppercase tracking-widest">Evara</span>
            </div>
            <div className="bg-white rounded-3xl aspect-[3/4] overflow-hidden border border-gray-150/80 shadow-sm p-4 flex items-center justify-center relative">
              <img src="/images/Reapin/Airbrush_Boxy_T-shirt_Horse-removebg-preview.png" alt="Featured Tee" className="max-h-full object-contain" />
              <span className="absolute bottom-3 right-3 px-2 py-0.5 text-[8px] font-bold bg-gray-50 border border-gray-100 rounded-full text-gray-500 uppercase tracking-widest">Reapin</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature summary cards */}
      <section className="grid sm:grid-cols-3 gap-6">
        {[
          { icon: Scan, title: 'AI Geometry Scan', desc: 'Captures physical joint metrics to estimate shoulders, chest, and hip dimensions.' },
          { icon: Shirt, title: 'Live Camera Mirror', desc: 'Overlays clothing designs onto your frame in real-time, matching movement.' },
          { icon: Sparkles, title: 'Tailored Closet', desc: 'Recommends fashion alignments from our partner brands matching your body type.' }
        ].map((feat, index) => (
          <div key={index} className="bg-white p-6 rounded-3xl border border-gray-150/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))] flex items-center justify-center">
              <feat.icon className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-gray-800 text-base">{feat.title}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </section>

      {/* Brands Marquee */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 pl-1">Partner Fashion Houses</h2>
        <BrandMarquee />
      </section>

      {/* Featured Products */}
      <section className="space-y-8">
        <div className="flex items-center justify-between pl-1">
          <h2 className="font-display font-black text-2xl text-gray-800 uppercase tracking-wider">Curated Arrivals</h2>
          <Link href="/catalog" className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--accent))] hover:underline flex items-center gap-1 transition-all">
            View All Catalog <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {featured.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Customer Feedback Section */}
      <section className="space-y-8 border-t border-gray-100 pt-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pl-1">
          <div>
            <h2 className="font-display font-black text-2xl text-gray-800 uppercase tracking-wider">Customer Feedback</h2>
            <p className="text-xs text-gray-400 mt-1">What our community says about their virtual fitting room experience.</p>
          </div>
          <Link href="/feedback" className="btn-outline px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-gray-300 text-gray-700 hover:bg-gray-50 self-start sm:self-auto">
            Write a Review
          </Link>
        </div>
        
        {mounted && reviews.length >= 4 ? (
          <div className="w-full overflow-hidden relative py-4">
            <div
              className="flex gap-6 w-max hover:[animation-play-state:paused] cursor-pointer"
              style={{
                animation: 'scroll-brands 80s linear infinite'

              }}
            >
              {/* Two identical segments so the marquee loops seamlessly */}
              {['scroll1', 'scroll2'].map(segment => (
                <div key={segment} className="flex gap-6 flex-shrink-0">
                  {reviews.map((item, idx) => (
                    <ReviewCard key={`${segment}-${item.id}-${idx}`} item={item} idx={idx} className="w-72 sm:w-80 h-44" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : mounted && reviews.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6 py-4">
            {reviews.map((item, idx) => (
              <ReviewCard key={`${item.id}-${idx}`} item={item} idx={idx} className="h-44" />
            ))}
          </div>
        ) : reviewsLoaded ? (
          <p className="text-sm text-gray-400 text-center py-10">No reviews yet — be the first to share your experience.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-150/80 shadow-sm flex flex-col justify-between space-y-4 h-44 shimmer" />
            ))}
          </div>
        )}
      </section>

      <div className="h-4" />
    </div>
  );
}

function ReviewCard({ item, idx, className = '' }: { item: Feedback; idx: number; className?: string }) {
  return (
    <div className={`bg-white p-6 rounded-3xl border border-gray-150/80 shadow-sm flex flex-col justify-between space-y-4 ${className}`}>
      <div className="space-y-2.5">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                i < item.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-[11px] text-gray-500 italic leading-relaxed line-clamp-3">
          "{item.message}"
        </p>
      </div>
      <div className="flex items-center justify-between border-t border-gray-50 pt-2.5 gap-2">
        <div className="truncate">
          <h4 className="font-bold text-xs text-gray-800 truncate">{item.name}</h4>
          <p className="text-[9px] text-gray-400 font-medium tracking-wide">
            {roles[idx % roles.length]}
          </p>
        </div>
        <span className="px-2 py-0.5 rounded bg-gray-50 text-[8px] font-bold text-gray-400 border border-gray-100 uppercase tracking-wider shrink-0">
          {bodyTags[idx % bodyTags.length]}
        </span>
      </div>
    </div>
  );
}
