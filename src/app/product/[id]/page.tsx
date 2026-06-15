'use client';

import { use, useState, useEffect } from 'react';
import { getProductById } from '@/lib/products';
import { notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Shirt, Ruler, ChevronDown, Check, Sparkles, Truck, ShieldAlert, X } from 'lucide-react';

// Map product brands and items to visual size chart images on disk
function getSizeChartForProduct(product: { brand: string; name: string }): string {
  const brand = product.brand.toLowerCase();
  const name = product.name.toLowerCase();

  if (brand === 'evara') {
    if (name.includes('emma')) return '/images/Evara/Emma top size chart.webp';
    if (name.includes('lea')) return '/images/Evara/Size Chart Lea Top.jpg';
    return '/images/Evara/Size Chart Vest.jpg';
  }
  if (brand === 'cozy cults') {
    return '/images/Cozy Cults/Size Chart Cozy Cults.jpeg';
  }
  if (brand === 'dandels') {
    if (name.includes('cline')) return '/images/Dandels/Size_Chart_Cline.png';
    if (name.includes('filament')) return '/images/Dandels/Size_Chart_Filament.png';
    if (name.includes('mile')) return '/images/Dandels/Size_Chart_Mile.png';
    if (name.includes('mora')) return '/images/Dandels/Size_Chart_Mora.png';
    if (name.includes('node')) return '/images/Dandels/Size_Chart_Node.png';
    if (name.includes('rhizo')) return '/images/Dandels/Size_Chart_Rhizo.png';
    if (name.includes('shortpant')) return '/images/Dandels/Size_Chart_Shortpants.png';
    if (name.includes('strata')) return '/images/Dandels/Size_Chart_Strata.png';
    return '/images/Dandels/Size_Chart_Drift_Trousers.png';
  }
  if (brand === 'reapin') {
    return '/images/Reapin/Reapin Size Chart.jpg';
  }
  if (brand === 'unit') {
    return '/images/Unit/Unit Size Chart.jpg';
  }
  if (brand === 'luna luv') {
    return '/images/Luna Luv/Size Chart Luna Luv.jpeg';
  }
  if (brand === 'angelique attire') {
    if (name.includes('strivelle')) return '/images/Angelique Attire/sizce chart strivelle.png';
    if (name.includes('florence')) return '/images/Angelique Attire/Size chart Florence.png';
    if (name.includes('kyrena')) return '/images/Angelique Attire/size chart kyrena.png';
    if (name.includes('lune')) return '/images/Angelique Attire/Size Chart Lune Top.png';
    if (name.includes('petals')) return '/images/Angelique Attire/Size Chart Petals.png';
    if (name.includes('vlvienne')) return '/images/Angelique Attire/size chart vlvienne.png';
    if (name.includes('amore') || name.includes('marjorie')) return '/images/Angelique Attire/size-chart-kemeja-amore-marjorie.png.png';
    return '/images/Angelique Attire/Size Chart Lune Top.png';
  }
  if (brand === 'wear on street') {
    return '/images/Wear on Street/Size Chart WearOnStreet.jpeg';
  }
  if (brand === 'madfo.u') {
    if (name.includes('skort')) return '/images/Madfo.u/Size Chart Keep It Skort.png';
    return '/images/Madfo.u/Size Chart Keep Me tight.png';
  }
  return '/images/Evara/Size Chart Vest.jpg';
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const product = getProductById(id);

  const [activeTab, setActiveTab] = useState<'description' | 'fit' | 'shipping'>('description');
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [userBodyType, setUserBodyType] = useState<string | null>(null);
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('bodyScanResults');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.bodyType?.name) {
          setUserBodyType(parsed.bodyType.name);
        }
      }
    } catch {}
  }, []);

  if (!product) {
    notFound();
  }

  const handleTryOn = () => {
    localStorage.setItem('selectedOutfit', product.image);
    localStorage.setItem('selectedProductName', product.name);
    localStorage.setItem('selectedBrandName', product.brand);
    router.push('/tryon');
  };

  const handlePurchaseClick = () => {
    try {
      const raw = localStorage.getItem('shopeeClicksLog') || '[]';
      const parsed = JSON.parse(raw);
      const newClick = {
        id: Date.now().toString(),
        brand: product.brand,
        product_name: product.name,
        clicked_at: Date.now()
      };
      parsed.unshift(newClick); // Add to beginning of logs
      localStorage.setItem('shopeeClicksLog', JSON.stringify(parsed));
    } catch {}
  };

  // Mock pricing tailored to the brand's local market
  const mockPrice = product.price || "Rp 349.000";

  // Check if product fit matches user body type
  const isRecommendedFit = userBodyType && product.fit.some(
    f => f.toLowerCase() === userBodyType.split(' ')[0].toLowerCase()
  );

  return (
    <div className="max-w-6xl mx-auto px-5 py-12">
      {/* Breadcrumb */}
      <Link href="/catalog" className="inline-flex items-center gap-1 text-xs uppercase tracking-widest font-bold text-gray-400 hover:text-[rgb(var(--fg))] mb-8 transition-colors duration-300">
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </Link>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
        {/* Left Column: Image Card */}
        <div className="bg-white rounded-3xl aspect-[4/5] flex items-center justify-center p-10 overflow-hidden border border-gray-150/80 shadow-sm relative group">
          <Image
            src={product.image}
            alt={product.name}
            width={500}
            height={625}
            className="w-full h-full object-contain transition-transform duration-750 ease-out group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {isRecommendedFit && (
            <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
              <Sparkles className="w-3.5 h-3.5 fill-white" />
              <span>Recommended Fit</span>
            </div>
          )}
        </div>

        {/* Right Column: Details */}
        <div className="flex flex-col space-y-6">
          <div>
            <p className="text-xs tracking-[0.2em] text-gray-400 font-bold uppercase mb-1">
              {product.brand}
            </p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 leading-tight">
              {product.name}
            </h1>
            <p className="text-2xl font-bold mt-3 text-gray-800 font-display">
              {mockPrice}
            </p>
          </div>

          <div className="border-t border-gray-150 pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase tracking-wider font-bold text-gray-400">Select Size</h3>
              <button 
                onClick={() => setIsSizeModalOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[rgb(var(--accent))] hover:text-[rgb(var(--accent-hover))] hover:underline cursor-pointer uppercase tracking-wider transition-colors duration-200 border-none bg-transparent"
              >
                <Ruler className="w-3.5 h-3.5" /> Size Guide
              </button>
            </div>

            <div className="flex gap-2.5">
              {['S', 'M', 'L', 'XL'].map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-11 h-11 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer border ${
                    selectedSize === size
                      ? 'bg-[rgb(var(--fg))] border-[rgb(var(--fg))] text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* AI Advisor Panel */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-amber-900 text-sm flex gap-3 shadow-sm">
            <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">AI Fit Assessment</p>
              {userBodyType ? (
                <p className="text-xs text-amber-800">
                  Based on your body scan results (**{userBodyType}**), size **{selectedSize}** will fit you {isRecommendedFit ? 'beautifully!' : 'comfortably.'}
                </p>
              ) : (
                <p className="text-xs text-amber-800">
                  You haven&apos;t done a body scan yet. We recommend doing a quick 3D scan to get precise size accuracy. <a href="/body-scan" className="underline font-bold hover:text-amber-900">Start Scan</a>
                </p>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 pt-2">
            <button
              onClick={handleTryOn}
              className="flex-1 btn-primary py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md whitespace-nowrap cursor-pointer"
            >
              <Shirt className="w-4 h-4" /> Virtual Try-On
            </button>
            <a
              href={product.shopeeUrl || "https://wa.me/message/WMVAXJ7JC73TF1"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handlePurchaseClick}
              className="flex-1 btn-dark py-2.5 px-4 text-xs font-bold flex items-center justify-center bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-none whitespace-nowrap cursor-pointer"
            >
              Purchase Item
            </a>
          </div>


          {/* E-commerce Tabs (Description / Fit Specs / Shipping) */}
          <div className="border-t border-gray-150 pt-6">
            <div className="flex border-b border-gray-150 text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
              {[
                { id: 'description', label: 'Details' },
                { id: 'fit', label: 'Fit Guide' },
                { id: 'shipping', label: 'Shipping' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-3 px-1 border-b-2 mr-6 transition-all duration-300 cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-[rgb(var(--fg))] text-[rgb(var(--fg))]'
                      : 'border-transparent hover:text-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-gray-500 leading-relaxed min-h-[80px]">
              {activeTab === 'description' && (
                <p>
                  {product.description || `Crafted from a premium lightweight weave, this piece represents a clean silhouette tailored for modern wardrobing. Features reinforced stitching and clean seam detailings. Designed in collaboration with ${product.brand} and exclusive to Fit Look customers.`}
                </p>
              )}
              {activeTab === 'fit' && (
                <div className="space-y-3">
                  <p>Fits best on: <strong className="capitalize">{product.fit.join(', ')}</strong> body shapes.</p>
                  <p>Recommended styling: Match with tailored bottoms or structured overlays for an editorial appearance.</p>
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <button 
                      onClick={() => setIsSizeModalOpen(true)}
                      className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-[rgb(var(--accent))] border border-gray-200 bg-gray-50 hover:bg-gray-100 px-4 py-2.5 rounded-xl transition-all duration-300 cursor-pointer"
                    >
                      <Ruler className="w-4 h-4 text-[rgb(var(--accent))]" /> View Visual Size Guide Chart
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'shipping' && (
                <div className="flex items-start gap-2.5">
                  <Truck className="w-4 h-4 text-gray-400 mt-0.5" />
                  <p>
                    Free courier shipping across all standard regions. Order packages are packed in eco-friendly minimalist boxes. Returns accepted within 14 days of try-on verification.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Size Chart Modal */}
      {isSizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-5xl w-full relative shadow-2xl border border-gray-100 flex flex-col items-center">
            {/* Header */}
            <div className="flex items-center justify-between w-full border-b border-gray-100 pb-4 mb-4">
              <div>
                <h3 className="font-display font-black text-xl text-gray-850 uppercase tracking-wide">
                  {product.brand} Size Chart
                </h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold font-mono">
                  Visual reference guidelines for product sizing
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsSizeModalOpen(false);
                  setIsZoomed(false);
                }}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-755 transition-colors cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Image container */}
            <div className="w-full max-h-[75vh] overflow-auto bg-gray-50 rounded-2xl border border-gray-150 flex items-center justify-center p-4 relative min-h-[300px]">
              <button 
                onClick={() => setIsZoomed(!isZoomed)}
                className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm border border-gray-250 text-gray-750 text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full shadow-md hover:bg-white transition-all cursor-pointer z-10"
              >
                {isZoomed ? 'Zoom Out' : 'Zoom In'}
              </button>
              <img 
                src={getSizeChartForProduct(product)} 
                alt={`${product.brand} Size Guide`}
                onClick={() => setIsZoomed(!isZoomed)}
                className={`transition-all duration-300 rounded-lg shadow-sm ${
                  isZoomed 
                    ? 'max-h-none max-w-none w-[160%] md:w-[130%] cursor-zoom-out' 
                    : 'max-h-[70vh] max-w-full object-contain cursor-zoom-in'
                }`}
              />
            </div>

            {/* Footer */}
            <p className="text-[10px] text-gray-400 mt-4 text-center leading-relaxed">
              * Note: Measure your body metrics or run the 3D Scan to match against these guidelines. Click the image or the button to zoom.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

