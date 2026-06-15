'use client';

import { useState, useEffect } from 'react';
import { Scan, Ruler, ArrowRight, RotateCcw, Sparkles, CheckCircle, HelpCircle, User, Activity } from 'lucide-react';
import { getClientProducts, Product } from '@/lib/products';
import ProductCard from '@/components/ProductCard';

interface BodyScanResult {
  height: number | null;
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  weight: number | null;
  bodyType: { name: string; key: string; desc: string; tips: string[]; fit: string[] };
  dataSource: string;
  confidenceScore: number;
  postureScore: number;
  aiConfidence: number;
  timestamp: number;
}

export default function MyFitLookPage() {
  const [scanResults, setScanResults] = useState<BodyScanResult | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [recommendedItems, setRecommendedItems] = useState<Product[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('bodyScanResults');
      const scan = raw ? JSON.parse(raw) : null;
      setScanResults(scan);

      const prof = localStorage.getItem('userProfile');
      setProfile(prof ? JSON.parse(prof) : null);

      if (scan?.bodyType?.fit) {
        const recommendedFits = scan.bodyType.fit;
        const activeProducts = getClientProducts();
        const filtered = activeProducts.filter(p => 
          p.fit.some(f => recommendedFits.includes(f.toLowerCase()))
        ).slice(0, 5);
        setRecommendedItems(filtered);
      }
    } catch {}
  }, []);

  // Empty state if no measurements or profile linked
  if (!scanResults && !profile) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-24 text-center animate-in fade-in duration-500">
        <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-gray-150 rounded-full border border-gray-200">
          <Scan className="w-6 h-6 text-gray-400 stroke-[1.5]" />
        </div>
        <h1 className="text-3xl font-black font-display text-gray-800 mb-2">Wardrobe Calibrations Required</h1>
        <p className="text-xs text-gray-400 max-w-sm mx-auto mb-8 leading-relaxed">
          Perform a quick AI posture scan or manually input your profile details to unlock custom fit suggestions.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/body-scan" className="btn-dark px-8 py-3.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg">
            <Scan className="w-4.5 h-4.5" /> Start Diagnostics <ArrowRight className="w-4 h-4" />
          </a>
          <a href="/profile" className="btn-outline px-8 py-3.5 text-xs font-bold flex items-center justify-center">
            Link Profile details
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-12 space-y-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-150 pb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">WARDROBE CABINET</h1>
          <p className="text-gray-400 text-sm md:text-base">
            Review your body profile dimensions and customized fits.
          </p>
        </div>
        <a href="/body-scan" className="btn-outline text-xs px-5 py-3 font-bold flex items-center gap-1.5 self-start sm:self-auto hover:bg-gray-50 transition-colors duration-300">
          <RotateCcw className="w-4 h-4" /> Recalibrate AI Scan
        </a>
      </div>

      {/* Grid Dashboard */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Unified Metrics Table (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-150/80 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Activity className="w-4.5 h-4.5 text-[rgb(var(--accent))]" />
            <h2 className="font-display font-bold text-sm text-gray-700 uppercase tracking-wider">
              Diagnostic Measurements
            </h2>
          </div>

          <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* Left side: Identity Details */}
            <div className="space-y-6 pb-6 md:pb-0">
              <h3 className="text-xs uppercase tracking-widest text-gray-400 font-bold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[rgb(var(--accent))]" /> Identity Info
              </h3>
              
              <div className="space-y-4">
                {[
                  { label: 'Profile Name', value: profile?.name || 'Guest User' },
                  { label: 'Gender Type', value: profile?.gender || 'Not specified', className: 'capitalize' },
                  { label: 'Linked Height', value: profile?.height ? `${profile.height} cm` : 'Not specified' },
                  { label: 'Linked Weight', value: profile?.weight ? `${profile.weight} kg` : 'Not specified' }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-xs font-semibold text-gray-400">{item.label}</span>
                    <span className={`text-xs font-bold text-gray-800 ${item.className || ''}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side: Sizing dimensions */}
            <div className="space-y-6 pt-6 md:pt-0 md:pl-8">
              <h3 className="text-xs uppercase tracking-widest text-gray-400 font-bold flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-[rgb(var(--accent))]" /> Physical Matrix
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Shoulders', value: scanResults?.shoulder ? `${scanResults.shoulder} cm` : '—' },
                  { label: 'Chest Bust', value: scanResults?.chest ? `${scanResults.chest} cm` : '—' },
                  { label: 'Waistline', value: scanResults?.waist ? `${scanResults.waist} cm` : '—' },
                  { label: 'Hip Width', value: scanResults?.hip ? `${scanResults.hip} cm` : '—' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50 flex flex-col justify-center">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">{item.label}</span>
                    <span className="text-base font-black font-display text-gray-800 mt-1">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {scanResults?.timestamp && (
            <div className="bg-gray-50/30 px-6 py-3 border-t border-gray-100 text-[10px] text-gray-400 flex items-center gap-1">
              <span>Sizing calibration synced via <strong>{scanResults.dataSource}</strong> on {new Date(scanResults.timestamp).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Right Column: Silhouette Analysis Sidebar (1/3 width) */}
        <div className="bg-white rounded-3xl border border-gray-150/80 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-amber-500 fill-amber-100" />
            <h2 className="font-display font-bold text-sm text-gray-700 uppercase tracking-wider">
              Silhouette Analysis
            </h2>
          </div>

          <div className="p-6 space-y-5">
            {scanResults ? (
              <>
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-[rgb(var(--accent))]/10 border border-[rgb(var(--accent))]/20 text-[rgb(var(--accent))] font-bold text-[10px] uppercase tracking-wider mb-2">
                    {scanResults.bodyType.name}
                  </span>
                  <p className="text-xs text-gray-400 leading-relaxed">{scanResults.bodyType.desc}</p>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Styling Rules</h4>
                  <ul className="space-y-2 text-xs text-gray-500">
                    {scanResults.bodyType.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-[rgb(var(--accent))] flex-shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="py-6 text-center text-gray-400">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs leading-relaxed px-4">
                  No body shape classification loaded. Please complete a camera calibration to receive styling rules.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clothing Recommendations Shelf */}
      {scanResults && recommendedItems.length > 0 && (
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-2 pl-1 border-b border-gray-100 pb-3">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-100" />
            <h2 className="font-display font-black text-lg text-gray-800 uppercase tracking-wider">
              Recommended Sizing Matches
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 animate-in fade-in duration-500">
            {recommendedItems.map(item => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
