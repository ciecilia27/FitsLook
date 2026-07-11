'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Menu, X, Phone, User, ShieldAlert, LogOut, LogIn, LayoutDashboard, ShoppingBag, Grid, MessageSquare } from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { getRole } from '@/lib/roles';

const userNavLinks = [
  { href: '/', label: 'Home' },
  { href: '/catalog', label: 'Catalog' },
  { href: '/myfitlook', label: 'My Fit Look' },
  { href: '/brand', label: 'Brands' },
  { href: '/feedback', label: 'Feedback' },
];

const adminNavLinks = [
  { href: '/admin?tab=analytics', label: 'Analytics', icon: LayoutDashboard },
  { href: '/admin?tab=cms', label: 'Manage Products', icon: ShoppingBag },
  { href: '/admin?tab=brands', label: 'Manage Brands', icon: Grid },
  { href: '/admin?tab=feedbacks', label: 'Manage Feedback', icon: MessageSquare },
];

const socialLinks = [
  { href: 'https://www.instagram.com/fitlook.official', label: 'Instagram', icon: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  )},
  { href: 'https://www.tiktok.com/@fitlook.official', label: 'TikTok', icon: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13a8.28 8.28 0 005.58 2.15v-3.44a4.85 4.85 0 01-3.58-1.44V6.69h3.58z"/>
    </svg>
  )},
  { href: 'https://wa.me/message/WMVAXJ7JC73TF1', label: 'WhatsApp', icon: Phone },
];

function NavbarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'analytics';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  // Auth States — from Supabase Auth context
  const { user, loading, signOut } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const isLoggedIn = !!user;
  const userEmail = user?.email ?? null;
  // Role is derived from the authenticated email (single source of truth in roles.ts),
  // so it works for both password and Google sign-in.
  const userRole = getRole(userEmail);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('userProfile');
      const scanRaw = localStorage.getItem('bodyScanResults');
      setHasProfile(!!raw || !!scanRaw);
    } catch {}
  }, [pathname]);

  const handleLogout = async () => {
    await signOut();
    setProfileMenuOpen(false);
    setMobileOpen(false);
    window.location.href = '/';
  };

  const showAdminMenu = isLoggedIn && userRole === 'admin';
  const navLinks = showAdminMenu ? adminNavLinks : userNavLinks;

  const isLinkActive = (href: string) => {
    const [linkPath, linkQuery] = href.split('?');
    if (linkPath !== pathname) return false;
    if (!linkQuery) return true; // match general path if no query param is targeted
    
    const targetTab = new URLSearchParams(linkQuery).get('tab');
    return targetTab === activeTab;
  };

  return (
    <header className="bg-white/85 backdrop-blur-md border-b border-gray-150/80 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
        {/* Logo and Brand */}
        <Link href={showAdminMenu ? "/admin" : "/"} className="flex items-center gap-3 flex-shrink-0 group">
          <img
            src="/images/Apps/fit you logo.jpg"
            alt="Fit Look Logo"
            className="w-10 h-10 rounded-full object-cover border border-gray-200 group-hover:scale-105 transition-transform duration-300"
          />
          <span className="text-[rgb(var(--fg))] group-hover:text-[rgb(var(--accent))] font-display font-black text-xl tracking-tight transition-colors duration-300 flex items-center gap-1.5">
            FIT LOOK
            {showAdminMenu && (
              <span className="text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase bg-[rgba(var(--accent),0.12)] text-[rgb(var(--accent))] border border-[rgba(var(--accent),0.2)]">
                ADMIN
              </span>
            )}
          </span>

        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${isLinkActive(link.href) ? 'active' : ''}`}
            >
              {link.label}
              {link.href === '/myfitlook' && hasProfile && (
                <span className="absolute -top-1 -right-2.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
              )}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4 relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className={`p-2.5 rounded-full border transition-all duration-300 cursor-pointer ${
              profileMenuOpen || pathname === '/profile' || (showAdminMenu && pathname === '/admin')
                ? 'bg-[rgb(var(--fg))] text-white border-[rgb(var(--fg))]'
                : 'bg-white border-gray-200 text-gray-600 hover:text-[rgb(var(--fg))] hover:border-[rgb(var(--accent))]'
            } relative`}
            title="Account Menu"
          >
            <User className="w-4 h-4" />
            {hasProfile && !showAdminMenu && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </button>

          {/* Profile Dropdown Menu */}
          {profileMenuOpen && (
            <div className="absolute right-0 top-12 w-48 bg-white border border-gray-150 rounded-2xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-gray-100 mb-1">
                <span className="block text-[8px] uppercase tracking-wider font-bold text-gray-400">Account Role</span>
                <span className="block text-xs font-bold text-gray-700 truncate">
                  {showAdminMenu ? 'Administrator' : isLoggedIn ? userEmail : 'Guest Mode'}
                </span>
              </div>
              
              {!showAdminMenu && (
                <>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-[rgb(var(--fg))] transition-colors"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    Profile Settings
                  </Link>
                  <Link
                    href="/myfitlook"
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-[rgb(var(--fg))] transition-colors"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    Wardrobe Cabinet
                  </Link>
                </>
              )}

              {showAdminMenu && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-[rgb(var(--fg))] transition-colors"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  Admin Central
                </Link>
              )}

              <div className="border-t border-gray-100 mt-1 pt-1">
                {isLoggedIn ? (
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50/35 transition-colors cursor-pointer"
                  >
                    Log Out
                  </button>
                ) : (
                  <Link
                    href="/signin"
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50/35 transition-colors"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    Log In
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden flex flex-col justify-between w-6 h-4.5 cursor-pointer p-0.5 focus:outline-none"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`w-full h-[2.5px] bg-[rgb(var(--fg))] rounded transition-all duration-300 ${mobileOpen ? 'translate-y-[6px] rotate-45' : ''}`} />
          <span className={`w-full h-[2.5px] bg-[rgb(var(--fg))] rounded transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`w-full h-[2.5px] bg-[rgb(var(--fg))] rounded transition-all duration-300 ${mobileOpen ? '-translate-y-[6px] -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-lg border-t border-gray-150 px-5 py-5 space-y-4 shadow-lg absolute top-16 left-0 w-full animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="space-y-2">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between py-2 text-base font-semibold transition-colors ${
                  isLinkActive(link.href)
                    ? 'text-[rgb(var(--accent))] border-l-2 border-[rgb(var(--accent))] pl-2'
                    : 'text-[rgb(var(--fg))] pl-2 hover:text-[rgb(var(--accent))]'
                } `}
                onClick={() => setMobileOpen(false)}
              >
                <span>{link.label}</span>
                {link.href === '/myfitlook' && hasProfile && (
                  <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded-full font-medium">Active</span>
                )}
              </Link>
            ))}
            
            {/* Mobile Account Submenu */}
            <div className="border-t border-gray-100 pt-2 space-y-1">
              {!showAdminMenu && (
                <Link
                  href="/profile"
                  className={`flex items-center justify-between py-2 text-base font-semibold transition-colors ${
                    pathname === '/profile'
                      ? 'text-[rgb(var(--accent))] border-l-2 border-[rgb(var(--accent))] pl-2'
                      : 'text-[rgb(var(--fg))] pl-2 hover:text-[rgb(var(--accent))]'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span>Profile Settings</span>
                  {hasProfile && (
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded-full font-medium">Synced</span>
                  )}
                </Link>
              )}

              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="w-full text-left py-2 text-base font-semibold text-red-600 pl-2 cursor-pointer flex items-center justify-between"
                >
                  <span>Log Out</span>
                  <LogOut className="w-4 h-4 text-red-500 mr-2" />
                </button>
              ) : (
                <Link
                  href="/signin"
                  className="flex items-center justify-between py-2 text-base font-semibold text-emerald-600 pl-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <span>Log In</span>
                  <LogIn className="w-4 h-4 text-emerald-500 mr-2" />
                </Link>
              )}
            </div>
          </div>

          {!showAdminMenu && (
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold pl-2">Social & Support</p>
              <div className="grid grid-cols-3 gap-2">
                {socialLinks.map(s => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-gray-50 text-[rgb(var(--fg))] hover:bg-[rgb(var(--accent))]/10 transition-colors"
                  >
                    <s.icon />
                    <span className="text-[11px] font-medium">{s.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<header className="bg-white/85 backdrop-blur-md border-b border-gray-150/80 sticky top-0 z-50 h-16 transition-all duration-300" />}>
      <NavbarContent />
    </Suspense>
  );
}
