'use client';

import { useState, useEffect } from 'react';
import { getClientBrands, Brand } from '@/lib/brands';
import { getClientProducts, Product } from '@/lib/products';
import Link from 'next/link';
import { ArrowRight, Search, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function BrandPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [catalog, setCatalog] = useState<Product[]>([]);

  useEffect(() => {
    setBrands(getClientBrands());
    setCatalog(getClientProducts());
  }, []);

  const getProductCount = (brandName: string) => {
    return catalog.filter(p => p.brand.toLowerCase() === brandName.toLowerCase()).length;
  };

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-5 py-12 space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-150 pb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">PARTNER BRANDS</h1>
          <p className="text-gray-400 text-sm md:text-base">
            Discover modern designs from our curated network of digital fashion houses.
          </p>
        </div>

        {/* Live Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search brands..."
            className="w-full pl-11 pr-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-4 focus:ring-[rgb(var(--accent))]/15 focus:border-[rgb(var(--accent))] text-xs bg-white shadow-sm font-medium"
          />
        </div>
      </div>

      {/* Brands Grid */}
      {filteredBrands.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {filteredBrands.map(brand => {
            const count = getProductCount(brand.name);
            const initials = brand.name.slice(0, 2).toUpperCase();
            
            return (
              <div
                key={brand.slug}
                className="bg-white rounded-3xl p-6 border border-gray-150/80 hover:border-[rgb(var(--accent))]/40 shadow-sm transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 relative group"
              >
                <div className="flex items-start gap-4">
                  {/* Brand Logo with Fallback Monogram */}
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt={`${brand.name} Logo`}
                        className={`w-full h-full ${
                          brand.darkBg 
                            ? 'object-contain bg-gray-950 p-1.5 rounded-xl' 
                            : 'object-cover'
                        }`}
                        onError={(e) => {
                          // Fallback to monogram on image error
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : null}
                    <span className="absolute inset-0 flex items-center justify-center text-gray-400 font-display font-black text-lg bg-gray-50 z-[-1]">
                      {initials}
                    </span>
                  </div>

                  {/* Brand Content */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black font-display text-gray-800 group-hover:text-[rgb(var(--accent))] transition-colors duration-300">
                        {brand.name}
                      </h2>
                      {count > 3 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[9px] font-bold tracking-wider uppercase flex items-center gap-0.5 border border-amber-100/50">
                          <Sparkles className="w-2.5 h-2.5 fill-amber-100" /> Hot
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                      {count} items in catalog
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed pt-1.5 line-clamp-2">
                      {brand.description}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-100 mt-6 pt-4 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                    AI Mirror Ready
                  </span>
                  <Link
                    href={`/catalog?brand=${encodeURIComponent(brand.name)}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[rgb(var(--accent))] hover:text-[rgb(var(--accent-hover))] transition-colors duration-300"
                  >
                    View Products <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-150/80 shadow-sm max-w-md mx-auto">
          <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 stroke-[1.5]" />
          <h3 className="font-display font-bold text-gray-800 mb-1">No brands matched</h3>
          <p className="text-xs text-gray-400 px-6 mb-4">
            Try adjusting your search keywords to find our partner brands.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="btn-outline px-5 py-2 text-xs font-bold"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
}
