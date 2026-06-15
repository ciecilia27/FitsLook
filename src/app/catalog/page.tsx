'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { getClientProducts, Product } from '@/lib/products';
import { SlidersHorizontal, Search, Grid, Loader2 } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

function CatalogContent() {
  const searchParams = useSearchParams();
  const brandQuery = searchParams.get('brand') || 'all';

  const [catalog, setCatalog] = useState<Product[]>([]);
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Load products and brands dynamically from localStorage
  useEffect(() => {
    const activeProducts = getClientProducts();
    setCatalog(activeProducts);
    const uniqueBrands = Array.from(new Set(activeProducts.map(p => p.brand))).sort();
    setAllBrands(uniqueBrands);
  }, []);

  // Handle updates from search parameters (e.g., when clicking brand link)
  useEffect(() => {
    if (brandQuery) {
      setSelectedBrand(brandQuery);
    }
  }, [brandQuery]);

  // Reset page to 1 when search query or filters update
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrand, selectedType, searchQuery]);

  const filtered = catalog.filter(p => {
    if (selectedBrand !== 'all' && p.brand.toLowerCase() !== selectedBrand.toLowerCase()) return false;
    if (selectedType !== 'all' && p.type !== selectedType) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) || 
        p.brand.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="max-w-6xl mx-auto px-5 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">CATALOG</h1>
          <p className="text-gray-400 text-sm md:text-base">
            Explore curated collections from our digital fashion house partners.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-gray-400 bg-white px-4 py-2 rounded-full border border-gray-150/80 shadow-sm self-start md:self-auto">
          <Grid className="w-3.5 h-3.5" />
          <span>{filtered.length} Items Matching</span>
        </div>
      </div>

      {/* Filters & Search Grid */}
      <div className="bg-white rounded-3xl p-6 border border-gray-150/80 shadow-sm space-y-6 mb-10">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-3">
          <SlidersHorizontal className="w-4 h-4 text-[rgb(var(--accent))]" />
          <span>Filter Closet</span>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search product or brand..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-[rgb(var(--accent))]/15 focus:border-[rgb(var(--accent))] text-xs font-semibold"
            />
          </div>

          {/* Brand Dropdown */}
          <div>
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="form-input bg-white cursor-pointer py-3"
            >
              <option value="all">All Brands</option>
              {allBrands.map(brand => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="form-input bg-white cursor-pointer py-3"
            >
              <option value="all">All Categories</option>
              <option value="top">Tops / Shirts</option>
              <option value="bottom">Bottoms / Pants</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="space-y-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-in fade-in duration-500">
            {paginatedItems.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8 border-t border-gray-150/80">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--accent))] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-all duration-300 cursor-pointer disabled:cursor-not-allowed bg-white shadow-sm"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer shadow-sm ${
                    currentPage === page
                      ? 'bg-[rgb(var(--fg))] text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--accent))] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-all duration-300 cursor-pointer disabled:cursor-not-allowed bg-white shadow-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-150/80 shadow-sm max-w-md mx-auto">
          <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 stroke-[1.5]" />
          <h3 className="font-display font-bold text-gray-800 mb-1">No products match</h3>
          <p className="text-xs text-gray-400 px-6 mb-6">
            Try adjusting your search query or dropdown filters.
          </p>
          <button
            onClick={() => { setSelectedBrand('all'); setSelectedType('all'); setSearchQuery(''); }}
            className="btn-outline px-6 py-2.5 text-xs font-bold"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-5 py-24 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-[rgb(var(--accent))] mx-auto" />
        <p className="text-xs text-gray-400 mt-2 font-medium">Loading catalog shelf...</p>
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}
