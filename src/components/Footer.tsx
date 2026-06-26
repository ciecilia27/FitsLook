import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[rgb(var(--fg))] text-gray-300 mt-auto border-t border-black/10">
      <div className="max-w-6xl mx-auto px-5 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-2">
            <h3 className="text-white font-display font-black text-2xl tracking-widest">FIT LOOK</h3>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              Discover fashion without limits. Combine advanced AI posture diagnostics with live camera overlay for the ultimate virtual try-on experience.
            </p>
            <div className="pt-2 flex gap-3">
              {[
                { label: 'IG', href: 'https://www.instagram.com/fitlook.official' },
                { label: 'TT', href: 'https://www.tiktok.com/@fitlook.official' },
                { label: 'WA', href: 'https://wa.me/message/WMVAXJ7JC73TF1' },
              ].map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-semibold text-white hover:bg-[rgb(var(--accent))] hover:border-[rgb(var(--accent))] transition-all duration-300"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-display font-bold text-sm tracking-wider uppercase mb-4">Explore</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/catalog" className="text-gray-400 hover:text-white transition-colors duration-300">Catalog</Link></li>
              <li><Link href="/body-scan" className="text-gray-400 hover:text-white transition-colors duration-300 font-medium text-[rgb(var(--accent))]">Body Scan</Link></li>
              <li><Link href="/myfitlook" className="text-gray-400 hover:text-white transition-colors duration-300">My Fit Look</Link></li>
              <li><Link href="/brand" className="text-gray-400 hover:text-white transition-colors duration-300">Partner Brands</Link></li>
            </ul>
          </div>


        </div>

        <div className="border-t border-white/5 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-4">
          <p>&copy; {new Date().getFullYear()} FIT LOOK. MirrorMe Technology. All Rights Reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
            <a href="/feedback" className="hover:text-gray-300 transition-colors">Submit Feedback</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
