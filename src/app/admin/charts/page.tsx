'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { getClientProducts, Product } from '@/lib/products';
import { getClientBrands, Brand } from '@/lib/brands';
import { initAnalyticsData, ClickLog, Feedback } from '@/lib/analytics';
import { 
  ArrowLeft, ShieldAlert, TrendingUp, Star, ShoppingBag, Grid, 
  Clock, Eye, MessageSquare, ChevronRight, Sparkles 
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getRole } from '@/lib/roles';

function ChartsPageContent() {
  const router = useRouter();
  const { user } = useAuth();

  // Auth states
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  // Data states
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [brandsList, setBrandsList] = useState<Brand[]>([]);
  const [clicks, setClicks] = useState<ClickLog[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  
  // Controls
  const [timeRangeFilter, setTimeRangeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [hoveredBrand, setHoveredBrand] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<{ type: string; index: number } | null>(null);

  // Authenticate and fetch analytics records
  useEffect(() => {
    try {
      // Derive admin from the authenticated email (roles.ts).
      setIsAdmin(getRole(user?.email) === 'admin');

      setCatalog(getClientProducts());
      setBrandsList(getClientBrands());

      const { clicks: loadedClicks, feedbacks: loadedFeedbacks } = initAnalyticsData();
      setClicks(loadedClicks);
      setFeedbacks(loadedFeedbacks);
    } catch {
      setIsAdmin(false);
    }
  }, [user]);

  if (isAdmin === null) {
    return <Loader />;
  }

  if (isAdmin === false) {
    return (
      <div className="max-w-md mx-auto px-5 py-24 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-3xl font-black font-display text-gray-800 mb-2">Access Denied</h1>
        <p className="text-xs text-gray-400 max-w-xs mx-auto mb-8 leading-relaxed">
          Admin dashboard credentials required to access the analytics ledger.
        </p>
        <Link href="/signin" className="btn-dark px-8 py-3.5 text-xs font-bold uppercase tracking-wider shadow-lg">
          Log in as Admin
        </Link>
      </div>
    );
  }

  // Filter click logs and feedback items based on the active timeframe
  const now = Date.now();
  let cutoff = Infinity;
  if (timeRangeFilter === '24h') cutoff = 24 * 60 * 60 * 1000;
  else if (timeRangeFilter === '7d') cutoff = 7 * 24 * 60 * 60 * 1000;
  else if (timeRangeFilter === '30d') cutoff = 30 * 24 * 60 * 60 * 1000;

  const filteredClicks = clicks.filter(c => now - c.clicked_at <= cutoff);
  const filteredFeedbacks = feedbacks.filter(f => now - new Date(f.created_at).getTime() <= cutoff);

  const totalClicks = filteredClicks.length || 1;
  const totalFeedbacksCount = filteredFeedbacks.length || 1;

  // 1. Calculations for traffic activity periods
  const trafficPeriods = [
    { name: 'Night (12am-6am)', count: 0, color: 'bg-indigo-500', hex: '#6366f1' },
    { name: 'Morning (6am-12pm)', count: 0, color: 'bg-orange-400', hex: '#fb923c' },
    { name: 'Afternoon (12pm-6pm)', count: 0, color: 'bg-emerald-500', hex: '#10b981' },
    { name: 'Evening (6pm-12am)', count: 0, color: 'bg-purple-600', hex: '#9333ea' },
  ];

  filteredClicks.forEach(c => {
    const hour = new Date(c.clicked_at).getHours();
    if (hour >= 0 && hour < 6) trafficPeriods[0].count++;
    else if (hour >= 6 && hour < 12) trafficPeriods[1].count++;
    else if (hour >= 12 && hour < 18) trafficPeriods[2].count++;
    else trafficPeriods[3].count++;
  });

  const maxTrafficCount = Math.max(...trafficPeriods.map(p => p.count), 1);
  const totalTrafficSum = trafficPeriods.reduce((sum, p) => sum + p.count, 0) || 1;

  // 2. Calculations for Clicks-per-Interval Line Chart
  interface ClickTrendPoint {
    label: string;
    count: number;
    startTime?: number;
    endTime?: number;
    key?: string;
  }
  let clickTrendPoints: ClickTrendPoint[] = [];
  if (timeRangeFilter === '24h') {
    // 6 intervals of 4 hours
    clickTrendPoints = Array.from({ length: 6 }).map((_, i) => {
      const h = new Date(now - (5 - i) * 4 * 60 * 60 * 1000);
      return {
        label: h.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        startTime: now - (6 - i) * 4 * 60 * 60 * 1000,
        endTime: now - (5 - i) * 4 * 60 * 60 * 1000,
        count: 0
      };
    });

    filteredClicks.forEach(c => {
      clickTrendPoints.forEach((p) => {
        if (p.startTime !== undefined && p.endTime !== undefined && c.clicked_at >= p.startTime && c.clicked_at < p.endTime) {
          p.count++;
        }
      });
    });
  } else if (timeRangeFilter === '30d') {
    // 6 intervals of 5 days
    clickTrendPoints = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now - (5 - i) * 5 * 24 * 60 * 60 * 1000);
      return {
        label: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        startTime: now - (6 - i) * 5 * 24 * 60 * 60 * 1000,
        endTime: now - (5 - i) * 5 * 24 * 60 * 60 * 1000,
        count: 0
      };
    });

    filteredClicks.forEach(c => {
      clickTrendPoints.forEach((p) => {
        if (p.startTime !== undefined && p.endTime !== undefined && c.clicked_at >= p.startTime && c.clicked_at < p.endTime) {
          p.count++;
        }
      });
    });
  } else {
    // Last 7 days daily grouping (default for 7d & all)
    clickTrendPoints = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        label: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        key: d.toDateString(),
        count: 0
      };
    });

    filteredClicks.forEach(c => {
      const clickDate = new Date(c.clicked_at).toDateString();
      const pt = clickTrendPoints.find((p) => p.key === clickDate);
      if (pt) pt.count++;
    });
  }

  const maxClicksTrend = Math.max(...clickTrendPoints.map(p => p.count), 1);
  const clickSVGPoints = clickTrendPoints.map((p, i) => {
    const x = (i * (600 / (clickTrendPoints.length - 1))).toFixed(1);
    const y = (160 - (p.count / maxClicksTrend) * 120).toFixed(1);
    return { x, y, label: p.label, count: p.count };
  });

  const clickPolylineStr = clickSVGPoints.map(p => `${p.x},${p.y}`).join(' ');
  const clickAreaPathStr = `M 0,180 L ${clickSVGPoints.map(p => `${p.x},${p.y}`).join(' L ')} L 600,180 Z`;

  // 3. Calculations for Ratings Line Chart (grouped by days/hours)
  interface RatingTrendPoint {
    label: string;
    avgRating: number;
    count: number;
    startTime?: number;
    endTime?: number;
    key?: string;
    ratingsSum: number;
  }
  let ratingTrendPoints: RatingTrendPoint[] = [];
  if (timeRangeFilter === '24h') {
    ratingTrendPoints = Array.from({ length: 6 }).map((_, i) => {
      const h = new Date(now - (5 - i) * 4 * 60 * 60 * 1000);
      return {
        label: h.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        startTime: now - (6 - i) * 4 * 60 * 60 * 1000,
        endTime: now - (5 - i) * 4 * 60 * 60 * 1000,
        ratingsSum: 0,
        count: 0,
        avgRating: 5
      };
    });

    filteredFeedbacks.forEach(f => {
      const t = new Date(f.created_at).getTime();
      ratingTrendPoints.forEach((p) => {
        if (p.startTime !== undefined && p.endTime !== undefined && t >= p.startTime && t < p.endTime) {
          p.ratingsSum += f.rating || 5;
          p.count++;
        }
      });
    });
  } else if (timeRangeFilter === '30d') {
    ratingTrendPoints = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now - (5 - i) * 5 * 24 * 60 * 60 * 1000);
      return {
        label: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        startTime: now - (6 - i) * 5 * 24 * 60 * 60 * 1000,
        endTime: now - (5 - i) * 5 * 24 * 60 * 60 * 1000,
        ratingsSum: 0,
        count: 0,
        avgRating: 5
      };
    });

    filteredFeedbacks.forEach(f => {
      const t = new Date(f.created_at).getTime();
      ratingTrendPoints.forEach((p) => {
        if (p.startTime !== undefined && p.endTime !== undefined && t >= p.startTime && t < p.endTime) {
          p.ratingsSum += f.rating || 5;
          p.count++;
        }
      });
    });
  } else {
    ratingTrendPoints = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        label: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        key: d.toDateString(),
        ratingsSum: 0,
        count: 0,
        avgRating: 5
      };
    });

    filteredFeedbacks.forEach(f => {
      const fDate = new Date(f.created_at).toDateString();
      const pt = ratingTrendPoints.find((p) => p.key === fDate);
      if (pt) {
        pt.ratingsSum += f.rating || 5;
        pt.count++;
      }
    });
  }

  ratingTrendPoints.forEach((p) => {
    p.avgRating = p.count > 0 ? p.ratingsSum / p.count : 5; // default to 5 if no entries
  });

  const ratingSVGPoints = ratingTrendPoints.map((p, i) => {
    const x = (i * (600 / (ratingTrendPoints.length - 1))).toFixed(1);
    const y = (160 - (p.avgRating / 5) * 120).toFixed(1); // 0 to 5-star scaling
    return { x, y, label: p.label, avg: p.avgRating.toFixed(1), count: p.count };
  });

  const ratingPolylineStr = ratingSVGPoints.map(p => `${p.x},${p.y}`).join(' ');
  const ratingAreaPathStr = ratingSVGPoints.length > 0
    ? `M 0,180 L ${ratingSVGPoints.map(p => `${p.x},${p.y}`).join(' L ')} L 600,180 Z`
    : '';

  // 4. Calculations for Brand Catalog Distribution
  const brandCounts = catalog.reduce<Record<string, number>>((acc, p) => {
    acc[p.brand] = (acc[p.brand] || 0) + 1;
    return acc;
  }, {});

  const brandShares = Object.entries(brandCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const totalProducts = catalog.length || 1;
  const colorsList = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#f43f5e', '#84cc16', '#6b7280'];

  const donutSlices = brandShares.map((brand, i) => {
    const pct = (brand.count / totalProducts) * 100;
    return {
      ...brand,
      pct,
      color: colorsList[i % colorsList.length]
    };
  });

  // Calculate stats summaries
  const clicksTrafficRate = clicks.length > 0 ? (filteredClicks.length / clicks.length * 100).toFixed(0) : '0';
  const averageExperience = filteredFeedbacks.length > 0
    ? (filteredFeedbacks.reduce((acc, f) => acc + (f.rating || 5), 0) / filteredFeedbacks.length).toFixed(1)
    : '5.0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-in fade-in duration-500">
      
      {/* Back button & Title header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-150 pb-6">
        <div className="space-y-2">
          <Link 
            href="/admin?tab=analytics" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[rgb(var(--accent))] uppercase tracking-wider transition-colors duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-800">
            ANALYTICS LEDGER
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-medium uppercase tracking-wider font-mono">
            Granular charts and corresponding source data logs
          </p>
        </div>

        {/* Global Select Filter */}
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-gray-150 shadow-sm self-start sm:self-auto">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Timeframe:</span>
          <select
            value={timeRangeFilter}
            onChange={e => setTimeRangeFilter(e.target.value as any)}
            className="px-2 py-1 border-none bg-transparent focus:outline-none text-xs font-bold cursor-pointer text-gray-700"
          >
            <option value="24h">24 Hours (Day)</option>
            <option value="7d">7 Days (Week)</option>
            <option value="30d">30 Days (Month)</option>
            <option value="all">All Time Records</option>
          </select>
        </div>
      </div>

      {/* Summaries strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-150/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-colors">
          <span className="text-[9px] tracking-widest text-gray-400 font-bold uppercase">Clicks in Period</span>
          <h2 className="text-2xl sm:text-3xl font-black font-display text-gray-800 mt-2 flex items-center justify-between">
            {filteredClicks.length}
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </h2>
          <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider mt-1 font-mono">
            {clicksTrafficRate}% of total traffic
          </span>
        </div>

        <div className="bg-white border border-gray-150/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-emerald-200 transition-colors">
          <span className="text-[9px] tracking-widest text-gray-400 font-bold uppercase">Satisfaction Score</span>
          <h2 className="text-2xl sm:text-3xl font-black font-display text-gray-800 mt-2 flex items-center justify-between">
            {averageExperience}/5.0
            <Star className="w-5 h-5 text-emerald-500 fill-emerald-500" />
          </h2>
          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mt-1 font-mono">
            {filteredFeedbacks.length} reviews log
          </span>
        </div>

        <div className="bg-white border border-gray-150/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-amber-200 transition-colors">
          <span className="text-[9px] tracking-widest text-gray-400 font-bold uppercase">Catalog Size</span>
          <h2 className="text-2xl sm:text-3xl font-black font-display text-gray-800 mt-2 flex items-center justify-between">
            {catalog.length}
            <ShoppingBag className="w-5 h-5 text-amber-500" />
          </h2>
          <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider mt-1 font-mono">
            Across {brandsList.length} partner houses
          </span>
        </div>

        <div className="bg-white border border-gray-150/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-purple-200 transition-colors">
          <span className="text-[9px] tracking-widest text-gray-400 font-bold uppercase">Peak Active Period</span>
          {(() => {
            const busiest = [...trafficPeriods].sort((a,b) => b.count - a.count)[0];
            return (
              <>
                <h2 className="text-xl sm:text-2xl font-black font-display text-gray-800 mt-2 flex items-center justify-between">
                  {busiest?.name.split(' ')[0] || 'N/A'}
                  <Clock className="w-5 h-5 text-purple-600" />
                </h2>
                <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider mt-1 font-mono">
                  {busiest?.count || 0} redirection actions
                </span>
              </>
            );
          })()}
        </div>
      </div>

      {/* DETAILED LEDGER GRID */}
      <div className="space-y-12">

        {/* SECTION 1: Clicks Trend */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150/80 shadow-sm flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            <div>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest font-mono">Metric Panel 01</span>
              <h3 className="font-display font-black text-xl text-gray-800 uppercase tracking-wide">
                Shopee Click Traffic
              </h3>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                Line chart mapping external Shopee button clicks over the active duration filter
              </p>
            </div>
            
            <div className="h-64 relative flex items-end pt-8 pr-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 600 180" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="clicksLedgerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Horizontal Grid lines */}
                <line x1="0" y1="36" x2="600" y2="36" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4,4" />
                <line x1="0" y1="72" x2="600" y2="72" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4,4" />
                <line x1="0" y1="108" x2="600" y2="108" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4,4" />
                <line x1="0" y1="144" x2="600" y2="144" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4,4" />
                <line x1="0" y1="180" x2="600" y2="180" stroke="#e5e7eb" strokeWidth="1.5" />

                {/* Area path */}
                <path d={clickAreaPathStr} fill="url(#clicksLedgerGrad)" />
                
                {/* Trend line */}
                <polyline points={clickPolylineStr} fill="none" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Data node markers */}
                {clickSVGPoints.map((p, i) => (
                  <g 
                    key={i} 
                    className="group/dot cursor-pointer"
                    onMouseEnter={() => setActiveTooltip({ type: 'clicks', index: i })}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <circle cx={p.x} cy={p.y} r="5" fill="white" stroke="#3b82f6" strokeWidth="3" className="transition-all duration-200 group-hover/dot:r-7" />
                    <circle cx={p.x} cy={p.y} r="16" fill="transparent" />
                  </g>
                ))}
              </svg>

              {/* Tooltip Overlay */}
              {activeTooltip?.type === 'clicks' && (() => {
                const pt = clickSVGPoints[activeTooltip.index];
                return (
                  <div 
                    className="absolute bg-gray-900 text-white text-[10px] font-bold p-2.5 rounded-xl shadow-xl border border-gray-800 z-30 transition-all pointer-events-none uppercase tracking-wider font-mono flex flex-col gap-1"
                    style={{ 
                      left: `${(parseFloat(pt.x) / 600) * 85}%`, 
                      bottom: `${(180 - parseFloat(pt.y)) * 1.1 + 10}px` 
                    }}
                  >
                    <span className="text-gray-400">{pt.label}</span>
                    <span className="text-blue-400 font-black">{pt.count} Clicks</span>
                  </div>
                );
              })()}
            </div>
            
            <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2 font-mono">
              {clickSVGPoints.map((p, i) => (
                <span key={i} className="w-16 text-center truncate">{p.label}</span>
              ))}
            </div>
          </div>

          {/* Ledger Table */}
          <div className="w-full lg:w-[400px] border border-gray-150 rounded-2xl overflow-hidden bg-gray-50 flex flex-col justify-between">
            <div className="p-4 bg-white border-b border-gray-150">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-500">Numerical Data Ledger</h4>
            </div>
            <div className="overflow-y-auto max-h-64 flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-150 text-[9px] font-bold uppercase text-gray-400 tracking-wider">
                    <th className="p-3">Period Label</th>
                    <th className="p-3 text-right">Click Counts</th>
                    <th className="p-3 text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {clickTrendPoints.map((pt, i) => {
                    const percentage = totalTrafficSum > 0 ? ((pt.count / totalTrafficSum) * 100).toFixed(1) : '0';
                    return (
                      <tr key={i} className="hover:bg-white transition-colors text-gray-600 font-medium">
                        <td className="p-3 font-semibold text-gray-700">{pt.label}</td>
                        <td className="p-3 text-right font-bold text-gray-800">{pt.count}</td>
                        <td className="p-3 text-right text-gray-400 font-mono">{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-gray-100 border-t border-gray-150 flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
              <span>Total Clicks Listed</span>
              <span className="text-gray-800 font-black">{totalTrafficSum}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: Calibration Rating Trend */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150/80 shadow-sm flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            <div>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest font-mono">Metric Panel 02</span>
              <h3 className="font-display font-black text-xl text-gray-800 uppercase tracking-wide">
                Satisfaction Rating Trend
              </h3>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                Average reviewer rating score calculated dynamically by days or hours
              </p>
            </div>
            
            <div className="h-64 relative flex items-end pt-8 pr-2">
              {ratingSVGPoints.length > 0 ? (
                <>
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 600 180" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="ratingLedgerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Rating grid lines (1-star increments) */}
                    <line x1="0" y1="36" x2="600" y2="36" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4,4" />
                    <line x1="0" y1="72" x2="600" y2="72" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4,4" />
                    <line x1="0" y1="108" x2="600" y2="108" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4,4" />
                    <line x1="0" y1="144" x2="600" y2="144" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4,4" />
                    <line x1="0" y1="180" x2="600" y2="180" stroke="#e5e7eb" strokeWidth="1.5" />

                    {/* Area fill */}
                    {ratingAreaPathStr && <path d={ratingAreaPathStr} fill="url(#ratingLedgerGrad)" />}
                    
                    {/* Polyline */}
                    {ratingPolylineStr && (
                      <polyline points={ratingPolylineStr} fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                    
                    {/* Tooltip nodes */}
                    {ratingSVGPoints.map((p, i) => (
                      <g 
                        key={i} 
                        className="group/dot cursor-pointer"
                        onMouseEnter={() => setActiveTooltip({ type: 'ratings', index: i })}
                        onMouseLeave={() => setActiveTooltip(null)}
                      >
                        <circle cx={p.x} cy={p.y} r="5" fill="white" stroke="#f59e0b" strokeWidth="3" className="transition-all duration-200 group-hover/dot:r-7" />
                        <circle cx={p.x} cy={p.y} r="16" fill="transparent" />
                      </g>
                    ))}
                  </svg>

                  {/* Tooltip Overlay */}
                  {activeTooltip?.type === 'ratings' && (() => {
                    const pt = ratingSVGPoints[activeTooltip.index];
                    return (
                      <div 
                        className="absolute bg-gray-900 text-white text-[10px] font-bold p-2.5 rounded-xl shadow-xl border border-gray-800 z-30 transition-all pointer-events-none uppercase tracking-wider font-mono flex flex-col gap-1"
                        style={{ 
                          left: `${(parseFloat(pt.x) / 600) * 85}%`, 
                          bottom: `${(180 - parseFloat(pt.y)) * 1.1 + 10}px` 
                        }}
                      >
                        <span className="text-gray-400">{pt.label}</span>
                        <span className="text-amber-400 font-black">{pt.avg} / 5 Stars</span>
                        <span className="text-gray-400 text-[8px]">{pt.count} Review(s)</span>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                  No feedback records found in timeframe
                </div>
              )}
            </div>
            
            <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2 font-mono">
              {ratingSVGPoints.map((p, i) => (
                <span key={i} className="w-16 text-center truncate">{p.label}</span>
              ))}
            </div>
          </div>

          {/* Ledger Table */}
          <div className="w-full lg:w-[400px] border border-gray-150 rounded-2xl overflow-hidden bg-gray-50 flex flex-col justify-between">
            <div className="p-4 bg-white border-b border-gray-150">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-500">Numerical Data Ledger</h4>
            </div>
            <div className="overflow-y-auto max-h-64 flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-150 text-[9px] font-bold uppercase text-gray-400 tracking-wider">
                    <th className="p-3">Period Label</th>
                    <th className="p-3 text-right">Avg Rating</th>
                    <th className="p-3 text-right">Feedbacks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {ratingTrendPoints.map((pt, i) => {
                    return (
                      <tr key={i} className="hover:bg-white transition-colors text-gray-600 font-medium">
                        <td className="p-3 font-semibold text-gray-700">{pt.label}</td>
                        <td className="p-3 text-right">
                          <span className="font-bold text-gray-800 font-mono mr-1.5">{pt.avgRating.toFixed(1)}</span>
                          <span className="text-amber-400">★</span>
                        </td>
                        <td className="p-3 text-right text-gray-400 font-mono">{pt.count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-gray-100 border-t border-gray-150 flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
              <span>Overall Avg Rating</span>
              <span className="text-amber-500 font-black flex items-center gap-1">
                {averageExperience} ★
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 3: Brand Catalog Share & Activity Periods */}
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Brand Donut */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150/80 shadow-sm flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest font-mono">Metric Panel 03</span>
                <h3 className="font-display font-black text-xl text-gray-800 uppercase tracking-wide">
                  Brand Distribution
                </h3>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                  Hover slices to evaluate brand representation in current catalog inventory
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-4">
                <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible relative">
                    {donutSlices.map((slice, i) => {
                      const sliceLength = (slice.pct / 100) * 251.327;
                      const strokeDasharray = `${sliceLength.toFixed(3)} 251.327`;
                      const strokeDashoffset = (- (donutSlices.slice(0, i).reduce((sum, s) => sum + s.pct, 0) / 100) * 251.327).toFixed(3);
                      return (
                        <circle
                          key={slice.name}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth="15"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          transform="rotate(-90 50 50)"
                          className="transition-all duration-300 cursor-pointer hover:[stroke-width:18px] focus:outline-none"

                          onMouseEnter={() => setHoveredBrand(slice.name)}
                          onMouseLeave={() => setHoveredBrand(null)}
                        />
                      );
                    })}
                  </svg>

                  {/* Cutout details center */}
                  <div className="absolute w-28 h-28 rounded-full bg-white flex flex-col items-center justify-center shadow-lg border border-gray-50 z-10 pointer-events-none select-none text-center p-3">
                    {hoveredBrand ? (
                      <>
                        <span className="text-[8px] uppercase tracking-wider font-black text-gray-400 leading-none truncate max-w-[90px]">
                          {hoveredBrand}
                        </span>
                        <span className="text-base font-black font-display text-gray-800 mt-1">
                          {brandCounts[hoveredBrand] || 0} Items
                        </span>
                        <span className="text-[9px] font-bold text-[rgb(var(--accent))] mt-0.5 font-mono">
                          {(((brandCounts[hoveredBrand] || 0) / totalProducts) * 100).toFixed(0)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[8px] uppercase tracking-wider font-bold text-gray-400 leading-none">
                          Total Items
                        </span>
                        <span className="text-xl font-black font-display text-gray-800 mt-1">
                          {totalProducts}
                        </span>
                        <span className="text-[8px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest font-mono">
                          Catalog Size
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {donutSlices.slice(0, 6).map(slice => (
                    <div 
                      key={slice.name} 
                      className={`flex items-center justify-between text-xs border-b border-gray-50 pb-1.5 last:border-0 last:pb-0 cursor-pointer p-1 rounded-lg transition-colors ${hoveredBrand === slice.name ? 'bg-gray-50 font-bold' : ''}`}
                      onMouseEnter={() => setHoveredBrand(slice.name)}
                      onMouseLeave={() => setHoveredBrand(null)}
                    >
                      <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }} />
                        <span className="font-semibold text-gray-600 truncate">{slice.name}</span>
                      </div>
                      <span className="font-bold text-gray-500 font-mono shrink-0">{slice.count} items ({slice.pct.toFixed(0)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Traffic Period Column Chart */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150/80 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest font-mono">Metric Panel 04</span>
                <h3 className="font-display font-black text-xl text-gray-800 uppercase tracking-wide">
                  Period Hourly Activity
                </h3>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                  Aggregated click events grouped into logical time-of-day categories
                </p>
              </div>

              <div className="h-44 flex items-end gap-5 pt-6 border-b border-gray-150 px-2 pb-2">
                {trafficPeriods.map((p, i) => {
                  const heightPct = (p.count / maxTrafficCount) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative cursor-pointer">
                      {/* Hover Counter */}
                      <span className="absolute -top-6 bg-gray-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 uppercase font-mono tracking-wider z-20">
                        {p.count}
                      </span>
                      {/* Column Bar */}
                      <div 
                        className="w-full max-w-[48px] rounded-t-xl transition-all duration-1000 ease-out relative shadow-[0_0_15px_rgba(0,0,0,0.02)]"
                        style={{ 
                          height: `${Math.max(heightPct, 6)}%`,
                          backgroundColor: p.hex
                        }}
                      >
                        {/* Inner glowing layer on hover */}
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase text-center truncate w-full tracking-wider mt-1 font-mono">
                        {p.name.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>

        {/* Brand Inventory Table Ledger */}
        <div className="bg-white rounded-3xl p-6 border border-gray-150/80 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">Detailed Brand Stock Ledger</h4>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Comprehensive items listing matching active catalog database</p>
            </div>
            <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-mono uppercase tracking-widest">
              {brandShares.length} Brands Registered
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-[9px] font-bold uppercase text-gray-400 tracking-wider font-mono">
                  <th className="p-3">Color Code</th>
                  <th className="p-3">Brand House Name</th>
                  <th className="p-3 text-right">Registered Items</th>
                  <th className="p-3 text-right">Catalog Share</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {donutSlices.map((slice, i) => {
                  return (
                    <tr 
                      key={slice.name} 
                      className={`hover:bg-gray-50/50 transition-colors text-gray-600 font-medium ${hoveredBrand === slice.name ? 'bg-gray-50 font-bold' : ''}`}
                      onMouseEnter={() => setHoveredBrand(slice.name)}
                      onMouseLeave={() => setHoveredBrand(null)}
                    >
                      <td className="p-3">
                        <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ backgroundColor: slice.color }} />
                      </td>
                      <td className="p-3 font-semibold text-gray-800">{slice.name}</td>
                      <td className="p-3 text-right font-bold text-gray-800">{slice.count}</td>
                      <td className="p-3 text-right font-mono text-gray-400">{slice.pct.toFixed(1)}%</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-600 uppercase tracking-widest">
                          Active
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

// Simple page loader
function Loader() {
  return (
    <div className="py-24 text-center max-w-sm mx-auto">
      <div className="w-10 h-10 animate-spin text-[rgb(var(--accent))] mx-auto border-3 border-gray-100 rounded-full" style={{
        borderTopColor: 'rgb(var(--accent))'
      }} />
      <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest mt-4">Assembling Analytics Ledger</h3>
      <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">Validating credentials and compiling database logs...</p>
    </div>
  );
}

// Wrap in Suspense boundary for Next.js build compilation
export default function ChartsPage() {
  return (
    <Suspense fallback={<Loader />}>
      <ChartsPageContent />
    </Suspense>
  );
}
