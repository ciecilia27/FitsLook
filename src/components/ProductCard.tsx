'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/products';
import { Eye, Shirt } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const handleTryOn = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    localStorage.setItem('selectedOutfit', product.image);
    localStorage.setItem('selectedProductName', product.name);
    localStorage.setItem('selectedBrandName', product.brand);
    window.location.href = '/tryon';
  };

  const isAvailable = product.isAvailable !== false;

  return (
    <div className={`card group cursor-pointer ${!isAvailable ? 'opacity-85' : ''}`}>
      {/* Fit Badge */}
      <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase bg-white/95 text-gray-800 rounded-full border border-gray-100 shadow-sm">
        {product.fit[0]} Fit
      </span>

      {/* Sold Out Badge */}
      {!isAvailable && (
        <span className="absolute top-3 right-3 z-10 px-2.5 py-1 text-[9px] font-black tracking-wider uppercase bg-red-600 text-white rounded-full shadow-sm">
          Sold Out
        </span>
      )}

      {/* Image Container */}
      <div className="aspect-[3/4] bg-gray-50 flex items-center justify-center p-6 overflow-hidden relative">
        <Image
          src={product.image}
          alt={product.name}
          width={300}
          height={400}
          className="w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        
        {/* Hover overlay controls */}
        <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
          <div className="flex flex-col lg:flex-row gap-1.5 w-full animate-in slide-in-from-bottom-3 duration-300">
            {isAvailable ? (
              <button
                onClick={handleTryOn}
                className="flex-1 btn-primary text-xs py-2 px-2.5 flex items-center justify-center gap-1 shadow-lg whitespace-nowrap cursor-pointer"
              >
                <Shirt className="w-3.5 h-3.5" /> Try-On
              </button>
            ) : (
              <button
                disabled
                className="flex-1 bg-gray-200 text-gray-400 text-[10px] py-2 px-1 flex items-center justify-center gap-1 rounded-xl cursor-not-allowed border border-gray-300 font-bold uppercase whitespace-nowrap"
              >
                Sold Out
              </button>
            )}
            <Link href={`/product/${product.id}`} className="flex-1">
              <span className="w-full btn-dark text-xs py-2 px-2.5 flex items-center justify-center gap-1 shadow-lg bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 whitespace-nowrap cursor-pointer">
                <Eye className="w-3.5 h-3.5" /> Detail
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Card Details */}
      <div className="p-4 flex flex-col flex-1 bg-white">
        <p className="text-[10px] tracking-widest text-gray-400 font-bold uppercase mb-1">
          {product.brand}
        </p>
        <h3 className="font-display font-bold text-sm text-gray-800 group-hover:text-[rgb(var(--accent))] transition-colors duration-300 truncate">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mt-1 capitalize">
          Category: {product.type}
        </p>
      </div>
    </div>
  );
}
