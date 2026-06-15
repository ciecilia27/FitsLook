import { brands } from '@/lib/brands';

export default function BrandMarquee() {
  return (
    <div className="marquee-wrapper my-4">
      <div className="marquee-track">
        <div className="flex items-center gap-10 px-5 font-display font-medium text-[11px] tracking-[0.3em] uppercase">
          {brands.map(brand => (
            <div key={brand.slug} className="flex items-center gap-10 whitespace-nowrap">
              <span className="text-gray-400 hover:text-[rgb(var(--fg))] transition-colors duration-300 cursor-default">
                {brand.name}
              </span>
              <span className="text-gray-300 select-none font-sans text-xs">•</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-10 px-5 font-display font-medium text-[11px] tracking-[0.3em] uppercase" aria-hidden="true">
          {brands.map(brand => (
            <div key={`${brand.slug}-dup`} className="flex items-center gap-10 whitespace-nowrap">
              <span className="text-gray-400 hover:text-[rgb(var(--fg))] transition-colors duration-300 cursor-default">
                {brand.name}
              </span>
              <span className="text-gray-300 select-none font-sans text-xs">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
