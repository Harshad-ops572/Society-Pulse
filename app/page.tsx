'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageContext';
import HeroPoster from '@/components/3d/HeroPoster';
import LiveTriageDemo from '@/components/landing/LiveTriageDemo';
import ChaosToClarity from '@/components/landing/ChaosToClarity';
import {
  ShieldAlert,
  Search,
  Sparkles,
  ArrowRight,
  Droplets,
  Layers,
  Car,
  Volume2,
  Trash2,
  Zap,
  Shield,
  Wrench,
  CheckCircle2,
  Lock,
  EyeOff,
  UserCheck,
  ServerOff,
  Activity,
  BadgeCheck,
} from 'lucide-react';
import { ComplaintCategory } from '@/types';

// Lazy-load 3D Hero Scene with ssr: false & HeroPoster loading state
const HeroScene = dynamic(() => import('@/components/3d/HeroScene'), {
  ssr: false,
  loading: () => <HeroPoster />,
});

interface PublicStats {
  activeIssues: number | null;
  resolvedThisMonth: number | null;
  avgResolutionHours: number | null;
  satisfactionPercent: number | null;
  countsByCategory: Record<string, number>;
  isDemoData: boolean;
}

export default function HomePage() {
  const { t, language } = useLanguage();
  const router = useRouter();

  const [stats, setStats] = useState<PublicStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Device capability & accessibility state
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isMobileOrLowPower, setIsMobileOrLowPower] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [demoLoginLoading, setDemoLoginLoading] = useState(false);

  useEffect(() => {
    // 1. Accessibility: check prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq.matches) setIsReducedMotion(true);

      const isMobile = window.innerWidth < 768;
      const isLowMemory =
        'deviceMemory' in navigator && (navigator as { deviceMemory?: number }).deviceMemory! <= 4;
      if (isMobile || isLowMemory) {
        setIsMobileOrLowPower(true);
      }
    }

    // 2. Fetch real dynamic stats from /api/public/stats
    setStatsLoading(true);
    fetch('/api/public/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success) {
          setStats({
            activeIssues: data.activeIssues,
            resolvedThisMonth: data.resolvedThisMonth,
            avgResolutionHours: data.avgResolutionHours,
            satisfactionPercent: data.satisfactionPercent,
            countsByCategory: data.countsByCategory || {},
            isDemoData: Boolean(data.isDemoData),
          });
        }
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const handleDemoRoleLogin = async () => {
    setDemoLoginLoading(true);
    try {
      const res = await fetch('/api/auth/demo-login', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        // Fallback to login page if demo mode is not enabled in env
        router.push('/login');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      router.push('/login');
    } finally {
      setDemoLoginLoading(false);
    }
  };

  const categories: {
    id: ComplaintCategory;
    icon: React.ComponentType<{ className?: string }>;
    name: string;
    color: string;
  }[] = [
    { id: 'water', icon: Droplets, name: t.catWater, color: 'from-cyan-500 to-blue-600' },
    { id: 'lift', icon: Layers, name: t.catLift, color: 'from-violet-500 to-indigo-600' },
    { id: 'electrical', icon: Zap, name: t.catElectrical, color: 'from-amber-400 to-orange-500' },
    { id: 'cleaning', icon: Trash2, name: t.catCleaning, color: 'from-emerald-400 to-teal-600' },
    { id: 'parking', icon: Car, name: t.catParking, color: 'from-blue-500 to-indigo-600' },
    { id: 'security', icon: Shield, name: t.catSecurity, color: 'from-rose-500 to-red-600' },
    { id: 'noise', icon: Volume2, name: t.catNoise, color: 'from-fuchsia-500 to-pink-600' },
    { id: 'other', icon: Wrench, name: t.catOther, color: 'from-slate-400 to-slate-600' },
  ];

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* 3D HERO SECTION (Guaranteed 0 layout shift with reserved height) */}
      <section className="relative w-full min-h-[85vh] sm:min-h-[90vh] lg:min-h-[92vh] h-[640px] sm:h-[720px] lg:h-[780px] flex items-center justify-center overflow-hidden">
        {/* Background glow gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />

        {/* 3D Canvas Background with Poster crossfade */}
        <div className="absolute inset-0 z-0">
          <HeroPoster />
          {!isReducedMotion && !isMobileOrLowPower && (
            <div
              className={`absolute inset-0 transition-opacity duration-1000 ${
                sceneReady ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <HeroScene onLoaded={() => setSceneReady(true)} />
            </div>
          )}
        </div>

        {/* Hero Content Overlay (Glass Floating Palette) */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pointer-events-none w-full">
          <div className="max-w-2xl pointer-events-auto">
            {/* Pill */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4 shadow-lg shadow-cyan-500/10"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.tagline}</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-100 tracking-tight leading-[1.1] mb-2"
            >
              {t.subline}
            </motion.h1>

            {/* Hindi Subline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              lang="hi"
              className="text-base sm:text-lg font-semibold text-cyan-400/90 mb-4"
            >
              {t.hindiSubline}
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-sm sm:text-base text-slate-300/90 leading-relaxed mb-8 max-w-xl backdrop-blur-sm bg-black/20 p-3 rounded-xl border border-white/5"
            >
              {t.heroDescription}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5"
            >
              <Link
                href="/report"
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 group"
              >
                <ShieldAlert className="w-4 h-4 text-cyan-200" />
                <span>{t.heroReportCta}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/track"
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md text-slate-200 font-bold text-sm border border-white/15 transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4 text-violet-400" />
                <span>{t.heroTrackCta}</span>
              </Link>

              {/* One-Click Judge Demo Button */}
              <button
                type="button"
                onClick={handleDemoRoleLogin}
                disabled={demoLoginLoading}
                className="px-5 py-3.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 backdrop-blur-md text-cyan-300 font-extrabold text-sm border border-cyan-500/40 shadow-lg shadow-cyan-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span>{demoLoginLoading ? 'Entering Demo...' : 'Try as committee member'}</span>
              </button>
            </motion.div>
          </div>
        </div>

        {/* 3D Interaction Tip */}
        <div className="absolute bottom-4 right-4 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] text-slate-400">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive 3D Twin • Hover & drag to inspect towers</span>
        </div>
      </section>

      {/* FEATURE 2: LIVE AI TRIAGE DEMO CARD */}
      <LiveTriageDemo />

      {/* LIVE PUBLIC STATS STRIP (Strictly computed from MongoDB) */}
      <section className="w-full border-y border-white/10 bg-[#070b16]/90 backdrop-blur-md py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Realtime Society Telemetry
            </span>

            {stats?.isDemoData && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <BadgeCheck className="w-3 h-3 text-amber-400" />
                Demo data
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 text-center">
            {/* Stat 1: Active Issues */}
            <div className="space-y-1">
              {statsLoading ? (
                <div className="h-8 w-16 bg-white/10 rounded animate-pulse mx-auto" />
              ) : (
                <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-300">
                  {stats?.activeIssues !== null && stats?.activeIssues !== undefined
                    ? stats.activeIssues
                    : '—'}
                </span>
              )}
              <p className="text-xs text-slate-400 font-semibold">{t.statOpen}</p>
            </div>

            {/* Stat 2: Resolved This Month */}
            <div className="space-y-1">
              {statsLoading ? (
                <div className="h-8 w-16 bg-white/10 rounded animate-pulse mx-auto" />
              ) : (
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                  {stats?.resolvedThisMonth !== null && stats?.resolvedThisMonth !== undefined
                    ? stats.resolvedThisMonth
                    : '—'}
                </span>
              )}
              <p className="text-xs text-slate-400 font-semibold">{t.statResolved}</p>
            </div>

            {/* Stat 3: Avg Resolution Time */}
            <div className="space-y-1">
              {statsLoading ? (
                <div className="h-8 w-16 bg-white/10 rounded animate-pulse mx-auto" />
              ) : (
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
                  {stats?.avgResolutionHours !== null && stats?.avgResolutionHours !== undefined
                    ? `${stats.avgResolutionHours}h`
                    : '—'}
                </span>
              )}
              <p className="text-xs text-slate-400 font-semibold">{t.statAvgTime}</p>
            </div>

            {/* Stat 4: Satisfaction (Only shown if real ratings exist) */}
            {stats?.satisfactionPercent !== null && stats?.satisfactionPercent !== undefined && (
              <div className="space-y-1">
                {statsLoading ? (
                  <div className="h-8 w-16 bg-white/10 rounded animate-pulse mx-auto" />
                ) : (
                  <span className="text-2xl sm:text-3xl font-black font-mono text-violet-400">
                    {stats.satisfactionPercent}%
                  </span>
                )}
                <p className="text-xs text-slate-400 font-semibold">{t.statSatisfaction}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FEATURE 3: CHAOS TO CLARITY SECTION */}
      <ChaosToClarity />

      {/* CATEGORY CARDS WITH DYNAMIC COUNTS */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 border-t border-white/5">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-violet-400 font-bold">
            Automated Intelligence
          </span>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight">
            {t.categoriesTitle}
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Realtime unresolved counts. Total equals {stats?.activeIssues ?? 0} active tickets.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const count = stats?.countsByCategory?.[cat.id] ?? 0;
            return (
              <motion.div
                key={cat.id}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Link
                  href={`/report?cat=${cat.id}`}
                  className="block glass-panel rounded-2xl p-5 border border-white/10 hover:border-cyan-500/40 transition-all text-center space-y-3 group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${cat.color} flex items-center justify-center mx-auto text-white shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-200 group-hover:text-cyan-300 transition-colors">
                      {cat.name}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {statsLoading ? '...' : `${count} ${count === 1 ? 'issue' : 'issues'}`}
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* FEATURE 8: TRUST & SECURITY SECTION ("Your Data is Safe") */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-white/10 bg-[#080d1a]/80 shadow-2xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Resident Privacy & Operational Integrity</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Your Data is Safe with SocietyPulse
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Designed from the ground up for residential privacy and non-stop society reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Point 1 */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Role-Based Access Control</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Strict separation between Admins, Committee Members, and Demo roles. Unauthenticated users cannot view sensitive resident details.
              </p>
            </div>

            {/* Point 2 */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <EyeOff className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Phone Numbers Hidden</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Resident contact numbers are never exposed in public feeds and are automatically masked to the last 4 digits in evaluation demo mode.
              </p>
            </div>

            {/* Point 3 */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">100% Human Override</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Volunteers always hold final authority. Every AI category, urgency score, and technician recommendation can be overridden in 1 click.
              </p>
            </div>

            {/* Point 4 */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ServerOff className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Zero-Loss Offline Fallback</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dual-layer AI architecture ensures issues are recorded and triaged by local NLP rules even if external cloud AI APIs are down.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA STRIP */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 to-violet-950/40 shadow-2xl space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            {language === 'hi'
              ? 'अपनी सोसायटी के लिए सोसाइटी पल्स शुरू करें'
              : 'Bring Peace & Efficiency to Your Housing Society Today'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            {language === 'hi'
              ? 'कमेटी के 5 मिनट के दैनिक डाइजेस्ट और निवासियों के लिए सरल रिपोर्टिंग से आज ही शुरू करें।'
              : 'No app download required for residents. Instant AI triage, automated duplicate prevention, and zero WhatsApp clutter.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/report"
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/25 transition-all flex items-center gap-2"
            >
              <span>{t.heroReportCta}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={handleDemoRoleLogin}
              className="px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-sm border border-white/10 transition-colors cursor-pointer"
            >
              Try Committee Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
