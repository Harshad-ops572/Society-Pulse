'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageContext';
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
  Clock,
  ThumbsUp,
  Activity,
  PhoneCall,
} from 'lucide-react';

// Lazy-load 3D Hero Scene with ssr: false
const HeroScene = dynamic(() => import('@/components/3d/HeroScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
      <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-3" />
      <span>Rendering 3D Housing Twin...</span>
    </div>
  ),
});

export default function HomePage() {
  const { t, language } = useLanguage();

  const [stats, setStats] = useState({
    openCount: 14,
    resolvedMonthCount: 28,
    avgResolutionTimeHours: 12,
    satisfactionRate: 94,
  });

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
      })
      .catch(() => {});
  }, []);

  const categories = [
    { id: 'water', icon: Droplets, name: t.catWater, color: 'from-cyan-500 to-blue-600', count: '4 issues' },
    { id: 'lift', icon: Layers, name: t.catLift, color: 'from-violet-500 to-indigo-600', count: '3 issues' },
    { id: 'electrical', icon: Zap, name: t.catElectrical, color: 'from-amber-400 to-orange-500', count: '2 issues' },
    { id: 'cleaning', icon: Trash2, name: t.catCleaning, color: 'from-emerald-400 to-teal-600', count: '2 issues' },
    { id: 'parking', icon: Car, name: t.catParking, color: 'from-blue-500 to-indigo-600', count: '3 issues' },
    { id: 'security', icon: Shield, name: t.catSecurity, color: 'from-rose-500 to-red-600', count: '1 issue' },
    { id: 'noise', icon: Volume2, name: t.catNoise, color: 'from-fuchsia-500 to-pink-600', count: '1 issue' },
    { id: 'other', icon: Wrench, name: t.catOther, color: 'from-slate-400 to-slate-600', count: '2 issues' },
  ];

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* 3D HERO SECTION */}
      <section className="relative w-full min-h-[90vh] lg:min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Background glow gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />

        {/* 3D Canvas Background & Interactive Canvas */}
        <div className="absolute inset-0 z-0">
          <HeroScene />
        </div>

        {/* Hero Content Overlay (Glass Floating Palette) */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pointer-events-none">
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
            </motion.div>
          </div>
        </div>

        {/* 3D Interaction Tip */}
        <div className="absolute bottom-4 right-4 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] text-slate-400">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive 3D Twin • Drag to inspect towers</span>
        </div>
      </section>

      {/* LIVE PUBLIC STATS STRIP */}
      <section className="w-full border-y border-white/10 bg-[#070b16]/90 backdrop-blur-md py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-300">
                {stats.openCount}
              </span>
              <p className="text-xs text-slate-400 font-semibold">{t.statOpen}</p>
            </div>

            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                {stats.resolvedMonthCount}
              </span>
              <p className="text-xs text-slate-400 font-semibold">{t.statResolved}</p>
            </div>

            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
                {stats.avgResolutionTimeHours}h
              </span>
              <p className="text-xs text-slate-400 font-semibold">{t.statAvgTime}</p>
            </div>

            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-black font-mono text-violet-400">
                {stats.satisfactionRate}%
              </span>
              <p className="text-xs text-slate-400 font-semibold">{t.statSatisfaction}</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="w-full py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold">
            Simplicity & Speed
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
            {t.howItWorksTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            {language === 'hi'
              ? 'व्हाट्सएप चैट की अव्यवस्था को 3 आसान चरणों में व्यवस्थित करें'
              : 'Designed so busy resident volunteers can resolve society issues in under 5 minutes daily.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ y: -6 }}
            className="glass-panel rounded-2xl p-7 border border-white/10 space-y-4 relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">{t.howStep1Title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{t.howStep1Desc}</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -6 }}
            className="glass-panel rounded-2xl p-7 border border-white/10 space-y-4 relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shadow-lg shadow-violet-500/10">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">{t.howStep2Title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{t.howStep2Desc}</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -6 }}
            className="glass-panel rounded-2xl p-7 border border-white/10 space-y-4 relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">{t.howStep3Title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{t.howStep3Desc}</p>
          </motion.div>
        </div>
      </section>

      {/* CATEGORY CARDS WITH 3D TILT EFFECT */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 border-t border-white/5">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-violet-400 font-bold">
            Automated Intelligence
          </span>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight">
            {t.categoriesTitle}
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click any category to initiate a fast, pre-classified complaint report.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
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
                    <span className="text-[11px] text-slate-500 font-medium">{cat.count}</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
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

            <Link
              href="/dashboard"
              className="px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-sm border border-white/10 transition-colors"
            >
              {t.heroDashboardCta}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
