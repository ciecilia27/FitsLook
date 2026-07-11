'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getClientProducts, saveClientProducts, Product } from '@/lib/products';
import { getClientBrands, saveClientBrands, Brand } from '@/lib/brands';
import { 
  ShieldAlert, Plus, Edit2, Trash2, ShoppingBag, Grid, 
  Eye, TrendingUp, X, Check, Star, ToggleLeft, ToggleRight, Link2
} from 'lucide-react';
import { resolveImageUrl, isGoogleDriveUrl } from '@/lib/google-drive';
import Link from 'next/link';
import { initAnalyticsData, ClickLog } from '@/lib/analytics';

import { useAuth } from '@/lib/auth-context';
import { getRole } from '@/lib/roles';

function AdminPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') || 'analytics';
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'analytics' | 'cms' | 'brands' | 'feedbacks'>(tabParam as any);
  const [timeRangeFilter, setTimeRangeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [hoveredBrand, setHoveredBrand] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Admin status is derived from the authenticated email (roles.ts).
  const isAdmin = getRole(user?.email) === 'admin';

  // Catalogs state
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [brandsList, setBrandsList] = useState<Brand[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandSearchQuery, setBrandSearchQuery] = useState('');

  // Product manager filters state
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // Product Form states
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formType, setFormType] = useState<'top' | 'bottom'>('top');
  const [formImage, setFormImage] = useState('/images/Evara/test-outfit.png');
  const [formFit, setFormFit] = useState<string[]>(['regular']);
  const [formShopeeUrl, setFormShopeeUrl] = useState('');

  // Brand Form states
  const [formBrandName, setFormBrandName] = useState('');
  const [formBrandSlug, setFormBrandSlug] = useState('');
  const [formBrandDesc, setFormBrandDesc] = useState('');
  const [formBrandLogo, setFormBrandLogo] = useState('/images/Evara/evara.jpg');
  const [formBrandDarkBg, setFormBrandDarkBg] = useState(false);
  const [formBrandStoreUrl, setFormBrandStoreUrl] = useState('');

  // Click logs state
  const [clicks, setClicks] = useState<ClickLog[]>([]);

  // Mark as mounted after hydration — prevents server/client mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load data from localStorage after mount
  useEffect(() => {
    if (!mounted) return;
    try {
      setCatalog(getClientProducts());
      setBrandsList(getClientBrands());
      const { clicks: loadedClicks, feedbacks: loadedFeedbacks } = initAnalyticsData();
      setClicks(loadedClicks);
      setFeedbacks(loadedFeedbacks);
    } catch {}
  }, [mounted]);

  // Sync tab state with search parameters
  useEffect(() => {
    if (tabParam && ['analytics', 'cms', 'brands', 'feedbacks'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  // Show loading while auth is being determined or before client hydration
  if (authLoading || !mounted) {
    return <Loader2 />;
  }

  // Sync tab navigation cleanly without full refresh
  const handleTabChange = (tab: 'analytics' | 'cms' | 'brands' | 'feedbacks') => {
    setActiveTab(tab);
    router.push(`/admin?tab=${tab}`);
  };

  // Auth Denial view
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-5 py-24 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-3xl font-black font-display text-gray-800 mb-2">Access Denied</h1>
        <p className="text-xs text-gray-400 max-w-xs mx-auto mb-8 leading-relaxed">
          Admin dashboard permissions required. Please log in using credentials with administrative clearance.
        </p>
        <Link href="/signin" className="btn-dark px-8 py-3.5 text-xs font-bold uppercase tracking-wider shadow-lg">
          Log in as Admin
        </Link>
      </div>
    );
  }

  // Stats calculation based on time range filter
  const getFilteredData = () => {
    const now = Date.now();
    let cutoff = Infinity;
    if (timeRangeFilter === '24h') cutoff = 24 * 60 * 60 * 1000;
    else if (timeRangeFilter === '7d') cutoff = 7 * 24 * 60 * 60 * 1000;
    else if (timeRangeFilter === '30d') cutoff = 30 * 24 * 60 * 60 * 1000;

    const filteredClicks = clicks.filter(c => now - c.clicked_at <= cutoff);
    const filteredFeedbacks = feedbacks.filter(f => now - new Date(f.created_at).getTime() <= cutoff);
    
    return { filteredClicks, filteredFeedbacks };
  };

  const { filteredClicks, filteredFeedbacks } = getFilteredData();

  const totalClicks = filteredClicks.length;
  const brandStats = Object.entries(
    filteredClicks.reduce<Record<string, number>>((acc, click) => {
      acc[click.brand] = (acc[click.brand] || 0) + 1;
      return acc;
    }, {})
  ).map(([brand, total]) => ({ brand, total })).sort((a, b) => b.total - a.total);

  const totalProducts = catalog.length;
  const totalBrands = brandsList.length;
  const avgFeedbackRating = filteredFeedbacks.length > 0
    ? (filteredFeedbacks.reduce((acc, f) => acc + (f.rating || 5), 0) / filteredFeedbacks.length).toFixed(1)
    : '5.0';

  // Product Form handlers
  const handleOpenAddProductModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormBrand(brandsList[0]?.name || 'Evara');
    setFormType('top');
    setFormImage('');
    setFormFit(['regular']);
    setFormShopeeUrl('');
    setIsProductModalOpen(true);
  };

  const handleOpenEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormBrand(prod.brand);
    setFormType(prod.type);
    setFormImage(prod.image);
    setFormFit(prod.fit);
    setFormShopeeUrl(prod.shopeeUrl || '');
    setIsProductModalOpen(true);
  };

  const handleProductFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    let updatedCatalog = [...catalog];
    // Auto-convert Google Drive links to direct image URLs
    const resolvedImage = resolveImageUrl(formImage);

    if (editingProduct) {
      // Edit
      updatedCatalog = updatedCatalog.map(p => 
        p.id === editingProduct.id 
          ? { 
              ...p, 
              name: formName, 
              brand: formBrand, 
              type: formType, 
              image: resolvedImage, 
              fit: formFit,
              shopeeUrl: formShopeeUrl || undefined
            } 
          : p
      );
    } else {
      // Add
      const newProduct: Product = {
        id: Date.now().toString(),
        name: formName,
        brand: formBrand,
        type: formType,
        image: resolvedImage,
        fit: formFit,
        shopeeUrl: formShopeeUrl || undefined
      };
      updatedCatalog.push(newProduct);
    }

    setCatalog(updatedCatalog);
    saveClientProducts(updatedCatalog);
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Delete this product from catalog?')) {
      const updated = catalog.filter(p => p.id !== id);
      setCatalog(updated);
      saveClientProducts(updated);
    }
  };

  const handleFitCheckbox = (fitType: string) => {
    if (formFit.includes(fitType)) {
      setFormFit(formFit.filter(f => f !== fitType));
    } else {
      setFormFit([...formFit, fitType]);
    }
  };

  // Brand Form handlers
  const handleOpenAddBrandModal = () => {
    setEditingBrand(null);
    setFormBrandName('');
    setFormBrandSlug('');
    setFormBrandDesc('');
    setFormBrandLogo('/images/Evara/evara.jpg');
    setFormBrandDarkBg(false);
    setFormBrandStoreUrl('');
    setIsBrandModalOpen(true);
  };

  const handleOpenEditBrandModal = (brand: Brand) => {
    setEditingBrand(brand);
    setFormBrandName(brand.name);
    setFormBrandSlug(brand.slug);
    setFormBrandDesc(brand.description);
    setFormBrandLogo(brand.logo);
    setFormBrandDarkBg(!!brand.darkBg);
    setFormBrandStoreUrl(brand.storeUrl || '');
    setIsBrandModalOpen(true);
  };

  const handleBrandFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBrandName.trim()) return;

    const slug = formBrandSlug.trim() || formBrandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let updatedBrands = [...brandsList];

    const newBrandData: Brand = {
      name: formBrandName,
      slug,
      description: formBrandDesc,
      logo: formBrandLogo,
      darkBg: formBrandDarkBg,
      storeUrl: formBrandStoreUrl || undefined
    };

    if (editingBrand) {
      // Edit matching by name or slug
      updatedBrands = updatedBrands.map(b => 
        b.slug === editingBrand.slug ? newBrandData : b
      );
    } else {
      // Add
      if (updatedBrands.some(b => b.slug === slug)) {
        alert('A brand with this slug already exists.');
        return;
      }
      updatedBrands.push(newBrandData);
    }

    setBrandsList(updatedBrands);
    saveClientBrands(updatedBrands);
    setIsBrandModalOpen(false);
  };

  const handleDeleteBrand = (slug: string) => {
    if (confirm('Delete this brand? Products referencing this brand will remain, but the brand page will be removed.')) {
      const updated = brandsList.filter(b => b.slug !== slug);
      setBrandsList(updated);
      saveClientBrands(updated);
    }
  };

  // Feedback Handlers
  const handleDeleteFeedback = (id: string) => {
    if (confirm('Delete this feedback review?')) {
      const updated = feedbacks.filter(f => f.id !== id);
      setFeedbacks(updated);
      localStorage.setItem('feedbacks', JSON.stringify(updated));
    }
  };

  const filteredProducts = catalog.filter(p => {
    // Search filter
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    // Brand filter
    if (selectedBrandFilter !== 'all' && p.brand.toLowerCase() !== selectedBrandFilter.toLowerCase()) return false;

    // Category filter
    if (selectedTypeFilter !== 'all' && p.type !== selectedTypeFilter) return false;

    return true;
  });

  const filteredBrands = brandsList.filter(b =>
    b.name.toLowerCase().includes(brandSearchQuery.toLowerCase()) ||
    b.description.toLowerCase().includes(brandSearchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-5 py-12 space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-150 pb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">ADMIN CENTRAL</h1>
          <p className="text-gray-400 text-sm md:text-base">
            Configure partner brand houses, manage catalog items, and review visitor experiences.
          </p>
        </div>
      </div>

      {/* Tab 1: Analytics */}
      {activeTab === 'analytics' && (() => {
        // 1. Dynamic calculations for traffic period trend column chart
        const activityPeriods = [
          { name: 'Night (12am-6am)', count: 0, barColor: 'bg-indigo-500/80 hover:bg-indigo-500' },
          { name: 'Morning (6am-12pm)', count: 0, barColor: 'bg-orange-400/80 hover:bg-orange-400' },
          { name: 'Afternoon (12pm-6pm)', count: 0, barColor: 'bg-emerald-500/80 hover:bg-emerald-500' },
          { name: 'Evening (6pm-12am)', count: 0, barColor: 'bg-purple-600/80 hover:bg-purple-600' },
        ];
        
        filteredClicks.forEach(c => {
          const hour = new Date(c.clicked_at).getHours();
          if (hour >= 0 && hour < 6) activityPeriods[0].count++;
          else if (hour >= 6 && hour < 12) activityPeriods[1].count++;
          else if (hour >= 12 && hour < 18) activityPeriods[2].count++;
          else activityPeriods[3].count++;
        });
        
        const maxActivityCount = Math.max(...activityPeriods.map(p => p.count), 1);

        // 2. Dynamic calculations for Clicks-per-Day Line Chart (Last 7 Days)
        let clickTrendPoints: { label: string; count: number }[] = [];
        const now = Date.now();

        if (timeRangeFilter === '24h') {
          // 24 hours grouped into 6 intervals of 4 hours
          clickTrendPoints = Array.from({ length: 6 }).map((_, i) => {
            const h = new Date(now - (5 - i) * 4 * 60 * 60 * 1000);
            return {
              label: h.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              startTime: now - (6 - i) * 4 * 60 * 60 * 1000,
              endTime: now - (5 - i) * 4 * 60 * 60 * 1000,
              count: 0
            };
          }) as any;

          filteredClicks.forEach(c => {
            clickTrendPoints.forEach((p: any) => {
              if (c.clicked_at >= p.startTime && c.clicked_at < p.endTime) {
                p.count++;
              }
            });
          });
        } else if (timeRangeFilter === '30d') {
          // 30 days grouped into 6 intervals of 5 days
          clickTrendPoints = Array.from({ length: 6 }).map((_, i) => {
            const d = new Date(now - (5 - i) * 5 * 24 * 60 * 60 * 1000);
            return {
              label: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
              startTime: now - (6 - i) * 5 * 24 * 60 * 60 * 1000,
              endTime: now - (5 - i) * 5 * 24 * 60 * 60 * 1000,
              count: 0
            };
          }) as any;

          filteredClicks.forEach(c => {
            clickTrendPoints.forEach((p: any) => {
              if (c.clicked_at >= p.startTime && c.clicked_at < p.endTime) {
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
          }) as any;

          filteredClicks.forEach(c => {
            const clickDate = new Date(c.clicked_at).toDateString();
            const pt = clickTrendPoints.find((p: any) => p.key === clickDate);
            if (pt) pt.count++;
          });
        }

        const maxClicksCount = Math.max(...clickTrendPoints.map(p => p.count), 1);
        const clicksPoints = clickTrendPoints.map((p, i) => {
          const x = (i * (500 / (clickTrendPoints.length - 1))).toFixed(1);
          const y = (120 - (p.count / maxClicksCount) * 90).toFixed(1);
          return { x, y, label: p.label, count: p.count };
        });

        const clicksPolylineStr = clicksPoints.map(p => `${p.x},${p.y}`).join(' ');
        const clicksAreaPathStr = `M 0,140 L ${clicksPoints.map(p => `${p.x},${p.y}`).join(' L ')} L 500,140 Z`;

        // 3. Dynamic calculations for Ratings Trend Line Chart (grouped by days)
        interface RatingTrendPoint {
          label: string;
          avgRating: number;
          count: number;
          startTime?: number;
          endTime?: number;
          key?: string;
          ratingsSum: number;
        }
        let ratingPoints: RatingTrendPoint[] = [];

        if (timeRangeFilter === '24h') {
          ratingPoints = Array.from({ length: 6 }).map((_, i) => {
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
            ratingPoints.forEach((p) => {
              if (p.startTime !== undefined && p.endTime !== undefined && t >= p.startTime && t < p.endTime) {
                p.ratingsSum += f.rating || 5;
                p.count++;
              }
            });
          });
        } else if (timeRangeFilter === '30d') {
          ratingPoints = Array.from({ length: 6 }).map((_, i) => {
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
            ratingPoints.forEach((p) => {
              if (p.startTime !== undefined && p.endTime !== undefined && t >= p.startTime && t < p.endTime) {
                p.ratingsSum += f.rating || 5;
                p.count++;
              }
            });
          });
        } else {
          ratingPoints = Array.from({ length: 7 }).map((_, i) => {
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
            const pt = ratingPoints.find((p) => p.key === fDate);
            if (pt) {
              pt.ratingsSum += f.rating || 5;
              pt.count++;
            }
          });
        }

        ratingPoints.forEach((p) => {
          p.avgRating = p.count > 0 ? p.ratingsSum / p.count : 5; // default to 5-stars if no logs
        });


        const ratingsPoints = ratingPoints.map((p, i) => {
          const x = (i * (500 / (ratingPoints.length - 1))).toFixed(1);
          const y = (130 - (p.avgRating / 5) * 90).toFixed(1); // average rating plotted from 0 to 5
          return { x, y, label: p.label, avg: p.avgRating.toFixed(1), count: p.count };
        });

        const ratingsPolylineStr = ratingsPoints.map(p => `${p.x},${p.y}`).join(' ');
        const ratingsAreaPathStr = ratingsPoints.length > 0 
          ? `M 0,140 L ${ratingsPoints.map(p => `${p.x},${p.y}`).join(' L ')} L 500,140 Z`
          : '';

        // 4. Dynamic calculations for Brand Inventory Donut Chart
        const brandCounts = catalog.reduce<Record<string, number>>((acc, p) => {
          acc[p.brand] = (acc[p.brand] || 0) + 1;
          return acc;
        }, {});

        const brandShareList = Object.entries(brandCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        const totalItemsCount = catalog.length || 1;

        let currentShareAngle = 0;
        const colorsList = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#f43f5e', '#84cc16', '#6b7280'];

        const donutSlices = brandShareList.map((brand, i) => {
          const pct = (brand.count / totalItemsCount) * 100;
          return {
            ...brand,
            pct,
            color: colorsList[i % colorsList.length]
          };
        });

        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header controls inside Analytics */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-150 shadow-sm">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Analytics Period:</label>
                <select
                  value={timeRangeFilter}
                  onChange={e => setTimeRangeFilter(e.target.value as any)}
                  className="px-3 py-1.5 border border-gray-200 rounded-xl focus:outline-none text-xs font-semibold cursor-pointer bg-white"
                >
                  <option value="24h">Last 24 Hours (Day)</option>
                  <option value="7d">Last 7 Days (Week)</option>
                  <option value="30d">Last 30 Days (Month)</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              
              <Link href="/admin/charts" className="btn-outline px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1 border-gray-200 text-gray-650 hover:bg-gray-50 self-start sm:self-auto shadow-sm">
                <Eye className="w-3.5 h-3.5" /> Full Detailed View
              </Link>
            </div>

            {/* Summary Dashboard Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-150/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <span className="text-[9px] tracking-widest text-gray-400 font-bold uppercase leading-none">Shopee Clicks</span>
                <h2 className="text-3xl font-black font-display text-gray-800 mt-2 flex items-center justify-between">
                  {totalClicks}
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </h2>
              </div>
              <div className="bg-white border border-gray-150/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <span className="text-[9px] tracking-widest text-gray-400 font-bold uppercase leading-none">Catalog Items</span>
                <h2 className="text-3xl font-black font-display text-gray-800 mt-2 flex items-center justify-between">
                  {totalProducts}
                  <ShoppingBag className="w-5 h-5 text-indigo-500" />
                </h2>
              </div>
              <div className="bg-white border border-gray-150/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <span className="text-[9px] tracking-widest text-gray-400 font-bold uppercase leading-none">Brand Houses</span>
                <h2 className="text-3xl font-black font-display text-gray-800 mt-2 flex items-center justify-between">
                  {totalBrands}
                  <Grid className="w-5 h-5 text-amber-500" />
                </h2>
              </div>
              <div className="bg-white border border-gray-150/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <span className="text-[9px] tracking-widest text-gray-400 font-bold uppercase leading-none">Avg Experience</span>
                <h2 className="text-3xl font-black font-display text-gray-800 mt-2 flex items-center justify-between">
                  {avgFeedbackRating}/5
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                </h2>
              </div>
            </div>

            {/* Visual Charts Row 1: Line Charts */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Chart 1.1: Clicks Over Time Line Chart */}
              <div className="bg-white rounded-3xl p-6 border border-gray-150/80 shadow-sm space-y-4">
                <div>
                  <h3 className="font-display font-bold text-sm text-gray-700 uppercase tracking-wider">Shopee Click Trend</h3>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold font-mono">Redirects logged over the selected period</p>
                </div>
                <div className="h-40 relative flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="clicksAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="#f3f4f6" strokeWidth="1.5" strokeDasharray="5,5" />
                    <line x1="0" y1="75" x2="500" y2="75" stroke="#f3f4f6" strokeWidth="1.5" strokeDasharray="5,5" />
                    <line x1="0" y1="120" x2="500" y2="120" stroke="#f3f4f6" strokeWidth="1.5" strokeDasharray="5,5" />

                    {/* Area fill */}
                    <path d={clicksAreaPathStr} fill="url(#clicksAreaGrad)" />
                    
                    {/* Line path */}
                    <polyline points={clicksPolylineStr} fill="none" stroke="rgb(var(--accent))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {/* Tooltip nodes */}
                    {clicksPoints.map((p, i) => (
                      <g key={i} className="group/dot cursor-pointer">
                        <circle cx={p.x} cy={p.y} r="4.5" fill="white" stroke="rgb(var(--accent))" strokeWidth="2.5" className="transition-all duration-200 group-hover/dot:r-6.5" />
                        <title>{p.count} clicks on {p.label}</title>
                        <circle cx={p.x} cy={p.y} r="12" fill="transparent" />
                      </g>
                    ))}
                  </svg>
                </div>
                <div className="flex justify-between text-[8px] font-bold text-gray-400 uppercase tracking-wider px-1">
                  {clicksPoints.map((p, i) => (
                    <span key={i} className="w-10 text-center">{p.label}</span>
                  ))}
                </div>
              </div>

              {/* Chart 1.2: Feedback Ratings Line Chart */}
              <div className="bg-white rounded-3xl p-6 border border-gray-150/80 shadow-sm space-y-4">
                <div>
                  <h3 className="font-display font-bold text-sm text-gray-700 uppercase tracking-wider">Calibration Rating Trend</h3>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold font-mono">Average customer scores over the selected period</p>
                </div>
                <div className="h-40 relative flex items-end">
                  {ratingsPoints.length > 0 ? (
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="ratingAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid lines */}
                      <line x1="0" y1="40" x2="500" y2="40" stroke="#f3f4f6" strokeWidth="1.5" strokeDasharray="5,5" />
                      <line x1="0" y1="85" x2="500" y2="85" stroke="#f3f4f6" strokeWidth="1.5" strokeDasharray="5,5" />
                      <line x1="0" y1="130" x2="500" y2="130" stroke="#f3f4f6" strokeWidth="1.5" strokeDasharray="5,5" />

                      {/* Area fill */}
                      {ratingsAreaPathStr && <path d={ratingsAreaPathStr} fill="url(#ratingAreaGrad)" />}
                      
                      {/* Line path */}
                      {ratingsPolylineStr && (
                        <polyline points={ratingsPolylineStr} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      )}
                      
                      {/* Tooltip nodes */}
                      {ratingsPoints.map((p, i) => (
                        <g key={i} className="group/dot cursor-pointer">
                          <circle cx={p.x} cy={p.y} r="4.5" fill="white" stroke="#f59e0b" strokeWidth="2.5" className="transition-all duration-200 group-hover/dot:r-6.5" />
                          <title>Avg Rating {p.avg}/5 stars on {p.label} ({p.count} feedbacks)</title>
                          <circle cx={p.x} cy={p.y} r="12" fill="transparent" />
                        </g>
                      ))}
                    </svg>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                      No feedback logs found in period
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-[8px] font-bold text-gray-400 uppercase tracking-wider px-1">
                  {ratingsPoints.map((p, i) => (
                    <span key={i} className="w-12 text-center truncate">{p.label}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Charts Row 2: Pie/Donut Chart & Column Chart */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Chart 2.1: Brand Catalog Share (Pie / Donut Chart) */}
              <div className="bg-white rounded-3xl p-6 border border-gray-150/80 shadow-sm space-y-6">
                <div>
                  <h3 className="font-display font-bold text-sm text-gray-700 uppercase tracking-wider">Brand Catalog Distribution</h3>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold font-mono">Hover slice to view brand shares</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
                  {/* Circular segment Donut SVG */}
                  <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
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

                    {/* Donut central cutout circle */}
                    <div className="absolute w-24 h-24 rounded-full bg-white flex flex-col items-center justify-center shadow-lg border border-gray-50 z-10 pointer-events-none select-none text-center p-2">
                      {hoveredBrand ? (
                        <>
                          <span className="text-[8px] uppercase tracking-wider font-black text-gray-400 leading-none truncate max-w-[80px]">
                            {hoveredBrand}
                          </span>
                          <span className="text-base font-black font-display text-gray-800 mt-1">
                            {brandCounts[hoveredBrand] || 0} Items
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
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Legends list */}
                  <div className="flex-1 space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {donutSlices.slice(0, 5).map(slice => (
                      <div 
                        key={slice.name} 
                        className="flex items-center justify-between text-xs border-b border-gray-50 pb-1.5 last:border-0 last:pb-0 cursor-pointer"
                        onMouseEnter={() => setHoveredBrand(slice.name)}
                        onMouseLeave={() => setHoveredBrand(null)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }} />
                          <span className="font-semibold text-gray-600 truncate max-w-[80px] sm:max-w-none">{slice.name}</span>
                        </div>
                        <span className="font-bold text-gray-500">{slice.count} items ({slice.pct.toFixed(0)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart 2.2: Activity Trend (Vertical Column Chart) */}
              <div className="bg-white rounded-3xl p-6 border border-gray-150/80 shadow-sm space-y-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-sm text-gray-700 uppercase tracking-wider">Visitor Traffic Trend</h3>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold font-mono">Redirects grouped by period of day</p>
                </div>
                
                {/* Column Bars container */}
                <div className="h-40 flex items-end justify-between gap-4 pt-6 border-b border-gray-100 pb-2 px-2">
                  {activityPeriods.map(period => {
                    const pct = (period.count / maxActivityCount) * 100;
                    return (
                      <div key={period.name} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative">
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 text-white text-[9px] font-bold py-1 px-2 rounded-lg absolute bottom-full mb-2 shadow-md z-10 whitespace-nowrap">
                          {period.count} Clicks
                        </div>
                        
                        {/* Bar pillar */}
                        <div 
                          className={`w-full max-w-[40px] rounded-t-xl transition-all duration-1000 ease-out relative ${period.barColor} shadow-[0_0_15px_rgba(0,0,0,0.02)]`}
                          style={{ height: `${Math.max(pct, 6)}%` }}
                        >
                          {/* Inner glowing layer on hover */}
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />
                        </div>
                        
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide truncate max-w-[80px] sm:max-w-none text-center">
                          {period.name.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Chart Footer description */}
                <div className="text-[10px] text-gray-400 font-semibold flex items-center justify-between px-1">
                  <span>Peak Period: {activityPeriods.reduce((prev, current) => (prev.count > current.count) ? prev : current).name.split(' ')[0]}</span>
                  <span>Total logged: {totalClicks}</span>
                </div>
              </div>
            </div>

            {/* Click Log Table (full width below graphs) */}
            <div className="bg-white rounded-3xl border border-gray-150/80 shadow-sm overflow-hidden flex flex-col h-[350px]">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-display font-bold text-sm text-gray-700 uppercase tracking-wider">Shopee Link Redirect Logs</h3>
                <span className="px-2.5 py-1 rounded-full bg-gray-50 text-[9px] font-bold text-gray-400 border border-gray-100">Showing last 50 clicks</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[9px] sticky top-0 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3.5">Brand</th>
                      <th className="px-6 py-3.5">Outfit Name</th>
                      <th className="px-6 py-3.5">Time Clicked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredClicks.map(click => (
                      <tr key={click.id} className="hover:bg-gray-50/30">
                        <td className="px-6 py-3 font-bold text-gray-700">{click.brand}</td>
                        <td className="px-6 py-3 text-gray-500">{click.product_name}</td>
                        <td className="px-6 py-3 text-gray-400">
                          {new Date(click.clicked_at).toLocaleDateString()} {new Date(click.clicked_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tab 2: Products CMS */}
      {activeTab === 'cms' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search product inventory..."
              className="w-full sm:w-80 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-[rgb(var(--accent))]/15 focus:border-[rgb(var(--accent))] text-xs font-semibold bg-white shadow-sm"
            />
            
            <button onClick={handleOpenAddProductModal} className="btn-primary px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1 self-start sm:self-auto shadow-md">
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50/60 p-4 rounded-2xl border border-gray-150/80 shadow-sm">
            <div>
              <label className="block text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-1">Filter Brand</label>
              <select
                value={selectedBrandFilter}
                onChange={e => setSelectedBrandFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none text-xs font-semibold bg-white cursor-pointer"
              >
                <option value="all">All Brands</option>
                {brandsList.map(b => (
                  <option key={b.slug} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-1">Filter Category</label>
              <select
                value={selectedTypeFilter}
                onChange={e => setSelectedTypeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none text-xs font-semibold bg-white cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="top">Tops / Shirts</option>
                <option value="bottom">Bottoms / Pants</option>
              </select>
            </div>
          </div>

          {/* Product Manager Table */}
          <div className="bg-white rounded-3xl border border-gray-150/80 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[9px] border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Preview</th>
                    <th className="px-6 py-4">Product Specs</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Fits</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredProducts.map(prod => {
                    return (
                      <tr key={prod.id} className="hover:bg-gray-50/20">
                        <td className="px-6 py-3">
                          <div className="w-9 h-11 bg-gray-50 rounded-lg p-1.5 border border-gray-100 flex items-center justify-center">
                            <img src={prod.image} alt={prod.name} className="max-w-full max-h-full object-contain" />
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className="block text-[8px] uppercase tracking-wider font-bold text-gray-400 leading-none mb-0.5">{prod.brand}</span>
                          <span className="block text-xs font-bold text-gray-800 leading-tight">{prod.name}</span>
                        </td>
                        <td className="px-6 py-3 capitalize text-gray-500">{prod.type}</td>
                        <td className="px-6 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {prod.fit.map(f => (
                              <span key={f} className="px-1.5 py-0.5 rounded bg-gray-100 text-[8px] text-gray-500 uppercase tracking-widest font-bold">
                                {f}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleOpenEditProductModal(prod)}
                              className="p-2 border border-gray-150 rounded-xl hover:text-[rgb(var(--accent))] hover:border-[rgb(var(--accent))] transition-all cursor-pointer shadow-sm bg-white"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-2 border border-gray-150 rounded-xl hover:text-red-600 hover:border-red-200 transition-all cursor-pointer shadow-sm bg-white"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Brands CMS */}
      {activeTab === 'brands' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <input
              type="text"
              value={brandSearchQuery}
              onChange={e => setBrandSearchQuery(e.target.value)}
              placeholder="Search partner brands..."
              className="w-full sm:w-80 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-[rgb(var(--accent))]/15 focus:border-[rgb(var(--accent))] text-xs font-semibold bg-white shadow-sm"
            />
            
            <button onClick={handleOpenAddBrandModal} className="btn-primary px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1 self-start sm:self-auto shadow-md">
              <Plus className="w-4 h-4" /> Add Brand
            </button>
          </div>

          {/* Brands List Table */}
          <div className="bg-white rounded-3xl border border-gray-150/80 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[9px] border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Logo Preview</th>
                    <th className="px-6 py-4">Brand specs</th>
                    <th className="px-6 py-4">Slug Identifier</th>
                    <th className="px-6 py-4">Description Text</th>
                    <th className="px-6 py-4 text-center">Contrast Capsule</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredBrands.map(b => (
                    <tr key={b.slug} className="hover:bg-gray-50/20">
                      <td className="px-6 py-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center p-1 border border-gray-150 ${b.darkBg ? 'bg-gray-950 border-gray-900' : 'bg-white'}`}>
                          <img src={b.logo} alt={b.name} className="max-w-full max-h-full object-contain rounded" />
                        </div>
                      </td>
                      <td className="px-6 py-3 font-bold text-gray-800">{b.name}</td>
                      <td className="px-6 py-3 font-mono text-gray-500 text-[10px]">{b.slug}</td>
                      <td className="px-6 py-3 text-gray-400 max-w-xs truncate" title={b.description}>{b.description}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${
                          b.darkBg 
                            ? 'bg-gray-950 text-white border-gray-900' 
                            : 'bg-gray-50 text-gray-500 border-gray-100'
                        }`}>
                          {b.darkBg ? 'Dark Capsule' : 'None'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleOpenEditBrandModal(b)}
                            className="p-2 border border-gray-150 rounded-xl hover:text-[rgb(var(--accent))] hover:border-[rgb(var(--accent))] transition-all cursor-pointer shadow-sm bg-white"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBrand(b.slug)}
                            className="p-2 border border-gray-150 rounded-xl hover:text-red-600 hover:border-red-200 transition-all cursor-pointer shadow-sm bg-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Feedbacks CMS */}
      {activeTab === 'feedbacks' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl border border-gray-150/80 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-display font-bold text-sm text-gray-700 uppercase tracking-wider">Submitted Calibration Reviews</h3>
              <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                {feedbacks.length} Total Feedbacks
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[9px] border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Rating</th>
                    <th className="px-6 py-4">Customer info</th>
                    <th className="px-6 py-4">Review Message</th>
                    <th className="px-6 py-4">Date logged</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-600">
                  {feedbacks.length > 0 ? (
                    feedbacks.map(f => (
                      <tr key={f.id} className="hover:bg-gray-50/20">
                        <td className="px-6 py-4">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < (f.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="block font-bold text-gray-800 leading-tight">{f.name || 'Anonymous'}</span>
                          <span className="block text-[10px] text-gray-400">{f.email || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4 max-w-sm whitespace-pre-wrap leading-relaxed text-xs text-gray-500">
                          {f.message}
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {f.created_at ? new Date(f.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteFeedback(f.id)}
                            className="p-2 border border-gray-150 rounded-xl hover:text-red-600 hover:border-red-200 transition-all cursor-pointer shadow-sm bg-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-20 text-gray-400 uppercase tracking-widest text-[10px] font-bold bg-white">
                        No customer feedback found in history logs.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-gray-150 max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-display font-black text-sm uppercase tracking-wider text-gray-800">
                {editingProduct ? 'Edit Outfit Spec' : 'Add New Product'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleProductFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Product Title</label>
                <input
                  type="text" required value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="form-input" placeholder="e.g. Classic Trenchcoat"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Brand House</label>
                  <select
                    value={formBrand} onChange={e => setFormBrand(e.target.value)}
                    className="form-input bg-white cursor-pointer"
                  >
                    {brandsList.map(b => (
                      <option key={b.slug} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Garment Category</label>
                  <select
                    value={formType} onChange={e => setFormType(e.target.value as any)}
                    className="form-input bg-white cursor-pointer"
                  >
                    <option value="top">Tops / Shirts</option>
                    <option value="bottom">Bottoms / Pants</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Visual Image URL</label>
                <input
                  type="text" value={formImage}
                  onChange={e => setFormImage(e.target.value)}
                  className="form-input text-xs"
                  placeholder="Paste a Google Drive link or image URL..."
                />
                {formImage && isGoogleDriveUrl(formImage) && (
                  <p className="text-[8px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
                    <Link2 className="w-3 h-3" /> Google Drive link detected — will be converted automatically
                  </p>
                )}
                {/* Live image preview */}
                {formImage && (
                  <div className="mt-2 w-20 h-24 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={resolveImageUrl(formImage)}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Product Link (Override)
                </label>
                <input
                  type="url"
                  value={formShopeeUrl}
                  onChange={e => setFormShopeeUrl(e.target.value)}
                  className="form-input text-xs"
                  placeholder="Leave empty to use brand default link"
                />
                <p className="text-[8px] text-gray-400 mt-1">
                  Override the brand&apos;s default store link for this specific product
                </p>
              </div>

              {/* Fit Recommendations */}
              <div className="space-y-1.5 border-t border-gray-100 pt-3">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400">Fits Recommendations</label>
                <div className="grid grid-cols-3 gap-2">
                  {['slim', 'regular', 'relaxed', 'athletic', 'hourglass', 'full'].map(fitType => {
                    const active = formFit.includes(fitType);
                    return (
                      <button
                        key={fitType} type="button"
                        onClick={() => handleFitCheckbox(fitType)}
                        className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 ${
                          active
                            ? 'bg-[rgb(var(--accent))]/10 border-[rgb(var(--accent))] text-[rgb(var(--accent))]'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {active && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>{fitType}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="w-full btn-dark py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 mt-6 shadow-md border-none">
                <Check className="w-4 h-4" /> Save Product Specifications
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Brand Add/Edit Modal */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-gray-150 max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-display font-black text-sm uppercase tracking-wider text-gray-800">
                {editingBrand ? 'Edit Brand Profile' : 'Add New Brand House'}
              </h3>
              <button onClick={() => setIsBrandModalOpen(false)} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleBrandFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Brand name</label>
                <input
                  type="text" required value={formBrandName}
                  onChange={e => {
                    setFormBrandName(e.target.value);
                    if (!editingBrand) {
                      setFormBrandSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                    }
                  }}
                  className="form-input" placeholder="e.g. Minimalist Studio"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Slug identifier (URL friendly)</label>
                <input
                  type="text" required value={formBrandSlug}
                  onChange={e => setFormBrandSlug(e.target.value)}
                  className="form-input font-mono text-xs" placeholder="e.g. minimalist-studio"
                  disabled={!!editingBrand}
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Brand Description</label>
                <textarea
                  required value={formBrandDesc}
                  onChange={e => setFormBrandDesc(e.target.value)}
                  rows={3}
                  className="form-input resize-none text-xs" placeholder="Describe the style, catalog focus, and sizing traits..."
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Brand Logo URL / Resource</label>
                <input
                  type="text" required value={formBrandLogo}
                  onChange={e => setFormBrandLogo(e.target.value)}
                  className="form-input text-xs" placeholder="/images/Evara/evara.jpg"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Store URL (Default)</label>
                <input
                  type="url" value={formBrandStoreUrl}
                  onChange={e => setFormBrandStoreUrl(e.target.value)}
                  className="form-input text-xs" placeholder="https://www.brandname.com"
                />
                <p className="text-[8px] text-gray-400 mt-1">
                  Default link for all products from this brand (can be overridden per product)
                </p>
              </div>

              {/* Dark BG option */}
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Contrast Settings</span>
                <button
                  type="button"
                  onClick={() => setFormBrandDarkBg(!formBrandDarkBg)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer select-none"
                >
                  {formBrandDarkBg ? (
                    <span className="flex items-center gap-1.5 text-gray-900 font-bold">
                      <ToggleRight className="w-8 h-8 stroke-[1.5] text-[rgb(var(--fg))]" /> Enable Dark Background Capsule
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-gray-400 font-medium">
                      <ToggleLeft className="w-8 h-8 stroke-[1.5]" /> Normal Transparent Display
                    </span>
                  )}
                </button>
              </div>

              {/* Submit */}
              <button type="submit" className="w-full btn-dark py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 mt-6 shadow-md border-none">
                <Check className="w-4 h-4" /> Save Brand Details
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<Loader2 />}>
      <AdminPageContent />
    </Suspense>
  );
}

// Simple loader helper
function Loader2({ className = "w-10 h-10 animate-spin text-[rgb(var(--accent))] mx-auto" }) {
  return (
    <div className="py-24 text-center">
      <div className={className} style={{
        border: '3px solid rgba(var(--accent), 0.1)',
        borderTop: '3px solid rgb(var(--accent))',
        borderRadius: '50%',
      }} />
      <p className="text-xs text-gray-400 mt-3 font-semibold uppercase tracking-wider">Validating Credentials...</p>
    </div>
  );
}
