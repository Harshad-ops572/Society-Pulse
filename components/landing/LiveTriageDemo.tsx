'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Zap,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Droplets,
  Layers,
  Car,
  Volume2,
  Trash2,
  Shield,
  Wrench,
  Languages,
  Activity,
} from 'lucide-react';
import { ComplaintCategory, UrgencyLevel } from '@/types';

const SAMPLE_CHIPS = [
  {
    label: '🚨 Lift Emergency (Trapped)',
    text: 'lift band hai, koi andar fasa hua hai, B wing',
  },
  {
    label: '💧 Water Outage (2 Days)',
    text: 'pani 2 din se nahi aa raha, flat A-302',
  },
  {
    label: '🚗 Blocked Parking',
    text: 'parking me kisi ne gaadi khadi kar di hai, meri gaadi nahi nikal rahi',
  },
  {
    label: '🔊 Late Night Music',
    text: 'Music bahut loud hai raat ko 1 baje tak, C-101',
  },
];

const CATEGORY_ICONS: Record<ComplaintCategory, React.ComponentType<{ className?: string }>> = {
  water: Droplets,
  lift: Layers,
  parking: Car,
  noise: Volume2,
  cleaning: Trash2,
  electrical: Zap,
  security: Shield,
  other: Wrench,
};

interface TriageDemoData {
  language: 'en' | 'hi' | 'hinglish';
  translatedText: string;
  summary: string;
  category: ComplaintCategory;
  urgency: UrgencyLevel;
  urgencyScore: number;
  urgencyReason: string;
  isSafetyRisk: boolean;
  suggestedAssigneeRole: string;
  suggestedAction: string;
  isSample?: boolean;
}

export default function LiveTriageDemo() {
  const [inputText, setInputText] = useState('lift band hai, koi andar fasa hua hai, B wing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TriageDemoData | null>(null);

  const handleTriage = async (customText?: string) => {
    const textToTriage = customText || inputText;
    if (!textToTriage.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/public/triage-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToTriage }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to triage issue');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error triaging text');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-500/15 text-red-300 border-red-500/30';
      case 'high':
        return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  const CategoryIcon = result?.category ? CATEGORY_ICONS[result.category] || Wrench : Wrench;

  return (
    <div className="w-full max-w-4xl mx-auto my-10 px-4 sm:px-6">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl bg-[#0e1628]/80">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Interactive AI Triage Sandbox</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Test Live Autonomous Complaint Triage
            </h2>
            <p className="text-xs text-slate-400">
              Type or pick any messy Hindi / Hinglish message. Zero database writes, instant AI analysis.
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-400 self-start sm:self-auto font-mono">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict 5 req/min rate limit</span>
          </div>
        </div>

        {/* Sample chips */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-400 mb-2">Try a realistic sample:</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputText(chip.text);
                  handleTriage(chip.text);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all text-left ${
                  inputText === chip.text
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 ring-1 ring-cyan-500/50'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input box */}
        <div className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={inputText}
              maxLength={300}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. lift band hai, koi andar fasa hua hai, B wing... / Type any issue in English, Hindi, or Hinglish"
              className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none transition-all"
            />
            <div className="absolute right-3 bottom-3 text-[11px] text-slate-500 font-mono">
              {inputText.length}/300
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-slate-400">
              ⚡ Powered by Google Gemini 2.5 Flash + Heuristic Guardrails.
            </p>

            <button
              type="button"
              onClick={() => handleTriage()}
              disabled={loading || !inputText.trim()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-95 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AI Triaging...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Triage it Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Animated Results Card */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="mt-6 p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Triage Intelligence Result</span>
                  {result.isSample && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Sample result (Mock Fallback)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-semibold text-slate-300">
                    <Languages className="w-3 h-3 text-cyan-400" />
                    <span className="capitalize">{result.language}</span>
                  </span>

                  {result.isSafetyRisk && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-red-500/20 border border-red-500/30 text-[11px] font-bold text-red-300 animate-pulse">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                      <span>Safety Hazard Flagged</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Reveal Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Category */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1"
                >
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Category
                  </span>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-100 capitalize">
                    <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                      <CategoryIcon className="w-4 h-4" />
                    </div>
                    <span>{result.category}</span>
                  </div>
                </motion.div>

                {/* 2. Urgency + Gauge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1"
                >
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Urgency Assessment
                  </span>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-extrabold uppercase border ${getUrgencyColor(
                        result.urgency
                      )}`}
                    >
                      {result.urgency}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      Score: {result.urgencyScore}/100
                    </span>
                  </div>
                  {/* Gauge bar */}
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        result.urgencyScore > 80
                          ? 'bg-red-500'
                          : result.urgencyScore > 60
                          ? 'bg-orange-500'
                          : result.urgencyScore > 35
                          ? 'bg-yellow-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${result.urgencyScore}%` }}
                    />
                  </div>
                </motion.div>

                {/* 3. Assignee Role */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1"
                >
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Suggested Assignee
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 capitalize">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>{result.suggestedAssigneeRole} Team</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{result.suggestedAction}</p>
                </motion.div>
              </div>

              {/* Translation & Reason */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="space-y-2 pt-2 border-t border-white/5 text-xs"
              >
                <div>
                  <span className="text-slate-400 font-semibold">Standardized English Translation:</span>
                  <p className="text-slate-200 italic mt-0.5 bg-black/20 p-2 rounded-lg border border-white/5 font-mono">
                    "{result.translatedText}"
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold">One-line Triage Rationale:</span>
                  <p className="text-slate-300 mt-0.5">{result.urgencyReason}</p>
                </div>
              </motion.div>

              {/* Bottom CTA to Report */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3"
              >
                <span className="text-xs text-slate-400">
                  Ready to see this ticket in your society queue?
                </span>
                <Link
                  href={`/report?text=${encodeURIComponent(inputText)}`}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <span>Report a real issue with this description</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
