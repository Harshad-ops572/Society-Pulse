'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ShieldAlert,
  Droplets,
  Layers,
  Car,
  Trash2,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Edit3,
  Smartphone,
  Wrench,
  Zap,
  Users,
  AlertTriangle,
  ArrowRight,
  Shield,
  Loader2,
} from 'lucide-react';

const SAMPLE_CHAT_TEXT = `12/03/2026, 08:14 - Sharmaji (B-402): Uncleji Namaste 🙏 Good morning to all
12/03/2026, 08:16 - Pooja (B-301): Lift B firse atak gayi hai 4th floor pe!!
12/03/2026, 08:17 - Amit (B-501): haan maine bhi dekha, koi andar hai kya?
12/03/2026, 08:19 - Sunita (A-203): Water pump band hai kya? subah se nalke sukhe hai A wing
12/03/2026, 08:21 - Verma (A-102): Plumber ka number do koi please emergency hai
12/03/2026, 08:22 - Kapoor (C-104): Have a blessed day everyone 🌸☕
12/03/2026, 08:23 - Pooja (B-301): KOI DEKH RAHA HAI? Bachha ro raha hai lift ke andar!!
12/03/2026, 08:25 - Rahul (A-304): Secretary sahab pani kab tak aayega office jana hai?
12/03/2026, 08:26 - Secretary: Ok noted
12/03/2026, 08:28 - Mehta (C-201): Basement me white Swift ne rasta block kar diya hai, meri gaadi nahi nikal rahi
12/03/2026, 08:29 - Sharmaji: Thanks
12/03/2026, 08:31 - Sunita (A-203): Tanker bulaya kya society ne?`;

const MESSY_MESSAGES = [
  { id: 1, sender: 'Sharmaji (B-402)', text: 'Uncleji Namaste 🙏 Good morning to all', time: '08:14 AM', type: 'noise' },
  { id: 2, sender: 'Pooja (B-301)', text: 'Lift B firse atak gayi hai 4th floor pe!!', time: '08:16 AM', type: 'lift', critical: true },
  { id: 3, sender: 'Amit (B-501)', text: 'haan maine bhi dekha, koi andar hai kya?', time: '08:17 AM', type: 'lift' },
  { id: 4, sender: 'Sunita (A-203)', text: 'Water pump band hai kya? subah se nalke sukhe hai A wing', time: '08:19 AM', type: 'water' },
  { id: 5, sender: 'Verma (A-102)', text: 'Plumber ka number do koi please emergency hai', time: '08:21 AM', type: 'water' },
  { id: 6, sender: 'Kapoor (C-104)', text: 'Have a blessed day everyone 🌸☕', time: '08:22 AM', type: 'noise' },
  { id: 7, sender: 'Pooja (B-301)', text: 'KOI DEKH RAHA HAI? Bachha ro raha hai lift ke andar!!', time: '08:23 AM', type: 'lift', critical: true },
  { id: 8, sender: 'Rahul (A-304)', text: 'Secretary sahab pani kab tak aayega office jana hai?', time: '08:25 AM', type: 'water' },
  { id: 9, sender: 'Secretary', text: 'Ok noted', time: '08:26 AM', type: 'admin' },
  { id: 10, sender: 'Mehta (C-201)', text: 'Basement me white Swift ne rasta block kar diya hai, meri gaadi nahi nikal rahi', time: '08:28 AM', type: 'parking' },
  { id: 11, sender: 'Sharmaji', text: 'Thanks', time: '08:29 AM', type: 'noise' },
  { id: 12, sender: 'Sunita (A-203)', text: 'Tanker bulaya kya society ne?', time: '08:31 AM', type: 'water' },
];

const INITIAL_SAMPLE_TICKETS: PublicTicket[] = [
  {
    id: 'SP-TICKET-01',
    title: 'Lift B Stuck with Child Inside',
    category: 'lift',
    urgency: 'critical',
    urgencyScore: 98,
    wing: 'Wing B',
    reportsMerged: 3,
    suggestedTeam: 'Emergency AMC Escalated',
    isSafetyRisk: true,
  },
  {
    id: 'SP-TICKET-02',
    title: 'Wing A Complete Water Outage',
    category: 'water',
    urgency: 'high',
    urgencyScore: 82,
    wing: 'Wing A',
    reportsMerged: 4,
    suggestedTeam: 'Plumbing Desk & Tanker',
    isSafetyRisk: false,
  },
  {
    id: 'SP-TICKET-03',
    title: 'Basement Exit Blocked by Swift',
    category: 'parking',
    urgency: 'medium',
    urgencyScore: 55,
    wing: 'Basement',
    reportsMerged: 1,
    suggestedTeam: 'Security Barrier Desk',
    isSafetyRisk: false,
  },
];

interface PublicTicket {
  id: string;
  title: string;
  category: 'water' | 'lift' | 'parking' | 'noise' | 'cleaning' | 'electrical' | 'security' | 'other';
  urgency: 'critical' | 'high' | 'medium' | 'low';
  urgencyScore: number;
  wing: string;
  reportsMerged: number;
  suggestedTeam: string;
  isSafetyRisk: boolean;
}

export default function ChaosToClarity() {
  const [viewMode, setViewMode] = useState<'phone' | 'textarea'>('phone');
  const [chatInput, setChatInput] = useState(SAMPLE_CHAT_TEXT);
  const [isSampleActive, setIsSampleActive] = useState(true);

  // AI Triage State
  const [isTriaging, setIsTriaging] = useState(false);
  const [hasTriaged, setHasTriaged] = useState(false);
  const [triageError, setTriageError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<PublicTicket[]>(INITIAL_SAMPLE_TICKETS);
  const [isSampleResult, setIsSampleResult] = useState(true);
  const [stats, setStats] = useState({
    totalMessages: 12,
    ticketsCount: 3,
  });

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq.matches) {
        setReducedMotion(true);
        setHasTriaged(true);
      }
    }
  }, []);

  const handleTriageChat = async () => {
    setIsTriaging(true);
    setTriageError(null);

    try {
      const res = await fetch('/api/public/chat-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: chatInput,
          isSample: isSampleActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to triage chat');
      }

      if (data.tickets && data.tickets.length > 0) {
        setTickets(data.tickets);
        setStats({
          totalMessages: data.stats?.totalMessages || 12,
          ticketsCount: data.tickets.length,
        });
        setIsSampleResult(!!data.isSampleResult);
      } else {
        // Fallback to sample if no tickets extracted
        setTickets(INITIAL_SAMPLE_TICKETS);
        setStats({ totalMessages: 12, ticketsCount: 3 });
        setIsSampleResult(true);
      }

      setHasTriaged(true);
    } catch (err: unknown) {
      console.error('Chat triage UI error:', err);
      setTriageError(
        err instanceof Error ? err.message : 'Error calling triage service. Please try again.'
      );
    } finally {
      setIsTriaging(false);
    }
  };

  const handleResetToSample = () => {
    setChatInput(SAMPLE_CHAT_TEXT);
    setIsSampleActive(true);
    setTickets(INITIAL_SAMPLE_TICKETS);
    setStats({ totalMessages: 12, ticketsCount: 3 });
    setIsSampleResult(true);
    setHasTriaged(false);
    setTriageError(null);
  };

  // Helper to pick category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lift':
        return <Layers className="w-4 h-4 text-violet-400" />;
      case 'water':
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case 'parking':
        return <Car className="w-4 h-4 text-amber-400" />;
      case 'cleaning':
        return <Trash2 className="w-4 h-4 text-emerald-400" />;
      case 'electrical':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'security':
        return <Shield className="w-4 h-4 text-rose-400" />;
      default:
        return <Wrench className="w-4 h-4 text-slate-400" />;
    }
  };

  // Helper to pick team lucide icon (replaces blue square emoji)
  const getTeamIcon = (team: string) => {
    const t = team.toLowerCase();
    if (t.includes('amc') || t.includes('emergency')) {
      return <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
    if (t.includes('plumb') || t.includes('tanker')) {
      return <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    }
    if (t.includes('security') || t.includes('guard')) {
      return <Shield className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
    }
    if (t.includes('housekeeping') || t.includes('clean')) {
      return <Trash2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
    return <Users className="w-3.5 h-3.5 text-slate-300 shrink-0" />;
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#090e1c] via-[#070b14] to-[#090e1c] border-y border-white/10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live AI Chat Triage Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-100 tracking-tight">
            From WhatsApp chaos to a 5-minute digest
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            In residential societies, life-safety emergencies get drowned in hundreds of greetings,
            duplicates, and noise. Test our live AI engine with real chat text or paste your own group export.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={isTriaging}
              onClick={handleTriageChat}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:opacity-95 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isTriaging ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI Triaging in progress...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Triage this chat with AI</span>
                </>
              )}
            </button>

            {hasTriaged && (
              <button
                type="button"
                onClick={handleResetToSample}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Sample</span>
              </button>
            )}
          </div>

          {triageError && (
            <div className="max-w-md mx-auto p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{triageError}</span>
            </div>
          )}
        </div>

        {/* 2-Column Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* LEFT: Neutral Green Phone Mockup OR Editable Textarea */}
          <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl bg-[#0b1419]/90 relative overflow-hidden flex flex-col min-h-[540px]">
            {/* Mock Chat Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 bg-[#0f2420] -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white text-xs">
                  GP
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">
                    Greenwood Palms Residents (100 flats)
                  </h4>
                  <p className="text-[10px] text-emerald-400">14 typing... • 12 active messages</p>
                </div>
              </div>

              {/* View Switcher: Phone vs Editable Textarea */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setViewMode('phone')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                    viewMode === 'phone'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Phone Preview"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px]">Chat View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('textarea')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                    viewMode === 'textarea'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Edit Raw Chat"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px]">Edit Text</span>
                </button>
              </div>
            </div>

            {/* Sub-label banner */}
            <div className="flex items-center justify-between text-[11px] text-slate-300 pb-2">
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                {isSampleActive ? 'Sample chat' : 'Custom pasted chat'}
              </span>
              <span className="text-[10px] text-slate-400">
                {viewMode === 'textarea' ? 'Up to 3,000 chars' : 'Realistic Hinglish format'}
              </span>
            </div>

            {/* View Mode 1: WhatsApp Phone Bubble Stream */}
            {viewMode === 'phone' ? (
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1 flex-1">
                {MESSY_MESSAGES.map((msg) => (
                  <motion.div
                    key={msg.id}
                    animate={
                      hasTriaged && !reducedMotion
                        ? {
                            // WCAG AA compliant contrast for dimmed messages
                            opacity: msg.critical ? 1 : 0.65,
                            scale: msg.critical ? 1.02 : 0.98,
                          }
                        : { opacity: 1, scale: 1 }
                    }
                    transition={{ duration: 0.3 }}
                    className={`p-2.5 rounded-2xl text-xs max-w-[85%] border shadow-sm ${
                      msg.type === 'admin'
                        ? 'ml-auto bg-[#005c4b] text-emerald-50 border-emerald-700/50'
                        : msg.critical
                        ? 'bg-[#2a1215] text-red-200 border-red-500/40 ring-1 ring-red-500/30'
                        : 'bg-[#1f2c34] text-slate-100 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span
                        className={`text-[10px] font-bold ${
                          msg.critical ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {msg.sender}
                      </span>
                      <span className="text-[9px] text-slate-300 font-mono">{msg.time}</span>
                    </div>
                    <p className="leading-snug text-slate-200">{msg.text}</p>
                    {msg.critical && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[9px] text-red-400 font-bold">
                        <ShieldAlert className="w-3 h-3" /> Emergency buried in group chat!
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              /* View Mode 2: Editable Textarea */
              <div className="space-y-2 flex-1 flex flex-col">
                <p className="text-[11px] text-slate-400">
                  Paste your group chat here. In WhatsApp: open group → ⋮ → More → Export chat → Without media.
                </p>
                <textarea
                  rows={14}
                  value={chatInput}
                  maxLength={3000}
                  onChange={(e) => {
                    setChatInput(e.target.value);
                    setIsSampleActive(e.target.value === SAMPLE_CHAT_TEXT);
                  }}
                  placeholder="Paste WhatsApp .txt export here..."
                  className="w-full flex-1 p-3 rounded-xl bg-black/50 border border-white/15 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none leading-relaxed"
                />
                <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                  <span>Phone numbers are automatically masked for privacy.</span>
                  <span>{chatInput.length} / 3,000 chars</span>
                </div>
              </div>
            )}

            <div className="mt-auto pt-3 border-t border-white/10 text-center text-[11px] text-slate-300">
              ⚠️ Resident messages buried under greetings, duplicate queries, and banter.
            </div>
          </div>

          {/* RIGHT: Clean Prioritised Ticket List */}
          <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-cyan-500/20 shadow-2xl bg-[#091122]/90 relative flex flex-col min-h-[540px]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                <h4 className="text-sm font-bold text-slate-100">SocietyPulse AI Triage Queue</h4>
              </div>

              <div className="flex items-center gap-2">
                {isSampleResult && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-slate-300 border border-white/10">
                    Sample result
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Ranked by Urgency
                </span>
              </div>
            </div>

            {/* Tickets with Framer Motion Animation */}
            <div className="space-y-3 flex-1 flex flex-col justify-start">
              {tickets.map((ticket, idx) => {
                const urgencyStyle = getUrgencyBadge(ticket.urgency);
                return (
                  <motion.div
                    key={ticket.id}
                    initial={reducedMotion ? false : { opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.08 }}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                          {getCategoryIcon(ticket.category)}
                        </div>
                        <span className="text-xs font-bold text-slate-100">{ticket.title}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${urgencyStyle}`}
                      >
                        {ticket.urgency} ({ticket.urgencyScore})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-300 font-semibold">{ticket.wing}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">
                          {ticket.reportsMerged} {ticket.reportsMerged > 1 ? 'reports merged' : 'report'}
                        </span>
                      </div>

                      {/* Lucide icon next to suggested team (replaces blue square emoji) */}
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                        {getTeamIcon(ticket.suggestedTeam)}
                        <span>{ticket.suggestedTeam}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Dynamic Real Caption (Never hardcoded 42 -> 9) */}
              <div className="mt-auto pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="font-extrabold text-cyan-300 text-sm tracking-wide">
                  {stats.totalMessages} messages → {stats.ticketsCount} tickets
                </span>

                <Link
                  href="/dashboard/import"
                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 group bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition-colors"
                >
                  <span>Committee: import your real group chat</span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
