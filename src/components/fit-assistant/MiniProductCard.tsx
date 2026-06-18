'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Shirt, Eye } from 'lucide-react';
import type { Product } from '@/lib/products';

/** Compact product card shown inline in Fit Assistant replies. */
export default function MiniProductCard({ product }: { product: Product }) {
  const handleTryOn = () => {
    localStorage.setItem('selectedOutfit', product.image);
    localStorage.setItem('selectedProductName', product.name);
    localStorage.setItem('selectedBrandName', product.brand);
    window.location.href = '/tryon';
  };

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-150 rounded-2xl p-2.5 shadow-sm">
      <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          width={56}
          height={56}
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] tracking-widest text-gray-400 font-bold uppercase">{product.brand}</p>
        <h4 className="font-display font-bold text-xs text-gray-800 truncate">{product.name}</h4>
        <p className="text-[10px] text-gray-400 capitalize">
          {product.type} · {product.fit[0]} fit
        </p>
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0">
        <button
          onClick={handleTryOn}
          className="px-2.5 py-1.5 rounded-lg bg-[rgb(var(--fg))] text-white text-[10px] font-bold flex items-center gap-1 hover:brightness-110 transition cursor-pointer"
        >
          <Shirt className="w-3 h-3" /> Try On
        </button>
        <Link
          href={`/product/${product.id}`}
          className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-[10px] font-bold flex items-center gap-1 hover:bg-gray-50 transition"
        >
          <Eye className="w-3 h-3" /> Details
        </Link>
      </div>
    </div>
  );
}
