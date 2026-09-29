'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeProvider';
import {
  ShieldAlert,
  Search,
  LayoutDashboard,
  LogIn,
  LogOut,
  Languages,
  Sun,
  Moon,
  Menu,
  X,
  Sparkles,
  Settings,
} from 'lucide-react';

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0B1020]/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  {t.appName}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-semibold tracking-wider rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  AI Triage
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                {language === 'hi' ? 'स्मार्ट हाउसिंग सोसाइटी' : 'Housing Society Twin'}
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/report"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === '/report'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                {t.navReport}
              </span>
            </Link>

            <Link
              href="/track"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname.startsWith('/track')
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Search className="w-4 h-4 text-violet-400" />
                {t.navTrack}
              </span>
            </Link>

            {/* Dashboard: only shown when logged in */}
            {user && (
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/dashboard'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                  {t.navDashboard}
                </span>
              </Link>
            )}

            {user && user.role === 'admin' && (
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/admin'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-amber-400" />
                  {t.navAdmin}
                </span>
              </Link>
            )}
          </nav>

          {/* Right controls: Language, Theme, Auth */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Single Language switch (Desktop & Mobile consistent placement) */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
              title="Toggle Language / भाषा बदलें"
              aria-label="Toggle Language"
            >
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            {/* Theme switch */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-white/10 transition-colors"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-violet-400" />
              )}
            </button>

            {/* Desktop Auth button */}
            <div className="hidden md:flex items-center">
              {user ? (
                <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                  <div className="text-right hidden lg:block">
                    <p className="text-xs font-medium text-slate-200">{user.name}</p>
                    <p className="text-[10px] text-cyan-400 uppercase tracking-wider">{user.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t.navLogout}</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90 text-white shadow-md shadow-cyan-500/20 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t.navLogin}</span>
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-300 hover:text-white bg-white/5 border border-white/10"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#0B1020]/95 backdrop-blur-xl px-4 pt-2 pb-4 space-y-2">
          <Link
            href="/report"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-white/5"
          >
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            {t.navReport}
          </Link>
          <Link
            href="/track"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-white/5"
          >
            <Search className="w-4 h-4 text-violet-400" />
            {t.navTrack}
          </Link>

          {/* Mobile Dashboard: only shown when logged in */}
          {user && (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-white/5"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              {t.navDashboard}
            </Link>
          )}

          {user && user.role === 'admin' && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-white/5"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              {t.navAdmin}
            </Link>
          )}

          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="text-xs font-medium text-slate-200">{user.name}</p>
                  <p className="text-[10px] text-cyan-400 uppercase tracking-wider">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-red-400 font-semibold py-1 flex items-center gap-1 bg-red-500/10 px-2.5 rounded-lg border border-red-500/20"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t.navLogout}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center text-xs text-white font-semibold py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.navLogin}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
