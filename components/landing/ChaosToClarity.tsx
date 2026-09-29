'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Droplets,
  Layers,
  Car,
  Trash2,
  CheckCircle2,
  MessageSquare,
  Clock,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

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

const CLEANED_TICKETS = [
  {
    id: 'SP-TICKET-01',
    title: 'Lift B Stuck with Child Inside',
    category: 'lift',
    urgency: 'critical',
    urgencyScore: 98,
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    wing: 'Wing B',
    reportsMerged: 3,
    icon: Layers,
    assignee: 'Emergency AMC Escalated',
  },
  {
    id: 'SP-TICKET-02',
    title: 'Wing A Complete Water Outage',
    category: 'water',
    urgency: 'high',
    urgencyScore: 82,
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    wing: 'Wing A',
    reportsMerged: 4,
    icon: Droplets,
    assignee: 'Plumbing Desk & Tanker',
  },
  {
    id: 'SP-TICKET-03',
    title: 'Basement Exit Blocked by Swift',
    category: 'parking',
    urgency: 'medium',
    urgencyScore: 55,
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    wing: 'Basement',
    reportsMerged: 1,
    icon: Car,
    assignee: 'Security Barrier Desk',
  },
  {
    id: 'SP-TICKET-04',
    title: 'Trash Collection Delayed Near B-Stairs',
    category: 'cleaning',
    urgency: 'low',
    urgencyScore: 28,
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    wing: 'Wing B',
    reportsMerged: 1,
    icon: Trash2,
    assignee: 'Housekeeping Team',
  },
];

export default function ChaosToClarity() {
  const [cleaned, setCleaned] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq.matches) {
        setReducedMotion(true);
        setCleaned(true);
      }
    }
  }, []);

  return (
    <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#090e1c] via-[#070b14] to-[#090e1c] border-y border-white/10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Before & After Transformation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-100 tracking-tight">
            From WhatsApp chaos to a 5-minute digest
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            In residential societies, life-safety emergencies get drowned in hundreds of greetings,
            duplicates, and noise. Watch SocietyPulse AI turn raw group chaos into structured resolution in seconds.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setCleaned(!cleaned)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              {cleaned ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset to Unsorted WhatsApp Chat</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Clean it up with AI Triage</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2-Column Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* LEFT: Neutral Green Phone Mockup (WhatsApp Style) */}
          <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl bg-[#0b1419]/90 relative overflow-hidden">
            {/* Mock Chat Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 bg-[#0f2420] -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white text-xs">
                  GP
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Greenwood Palms Residents (120 flats)</h4>
                  <p className="text-[10px] text-emerald-400">14 typing... • 42 unread messages</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                Unstructured Chat
              </span>
            </div>

            {/* Chat Bubble Stream */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {MESSY_MESSAGES.map((msg) => (
                <motion.div
                  key={msg.id}
                  animate={
                    cleaned && !reducedMotion
                      ? { opacity: msg.critical ? 1 : 0.25, scale: msg.critical ? 1.02 : 0.98 }
                      : { opacity: 1, scale: 1 }
                  }
                  transition={{ duration: 0.3 }}
                  className={`p-2.5 rounded-2xl text-xs max-w-[85%] border shadow-sm ${
                    msg.type === 'admin'
                      ? 'ml-auto bg-[#005c4b] text-emerald-50 border-emerald-700/50'
                      : msg.critical
                      ? 'bg-[#2a1215] text-red-200 border-red-500/40 ring-1 ring-red-500/30'
                      : 'bg-[#1f2c34] text-slate-200 border-white/5'
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
                    <span className="text-[9px] text-slate-400 font-mono">{msg.time}</span>
                  </div>
                  <p className="leading-snug">{msg.text}</p>
                  {msg.critical && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[9px] text-red-400 font-bold">
                      <ShieldAlert className="w-3 h-3" /> Emergency buried in chat!
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 text-center text-[11px] text-slate-400">
              ⚠️ 12 messages in 17 minutes. Key emergency lost between greetings and duplicates.
            </div>
          </div>

          {/* RIGHT: Clean Prioritised Ticket List */}
          <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-cyan-500/20 shadow-2xl bg-[#091122]/90 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                <h4 className="text-sm font-bold text-slate-100">SocietyPulse AI Triage Queue</h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Ranked by Urgency
              </span>
            </div>

            {/* Tickets */}
            <div className="space-y-3 min-h-[460px] flex flex-col justify-start">
              {CLEANED_TICKETS.map((ticket, idx) => {
                const IconComponent = ticket.icon;
                return (
                  <motion.div
                    key={ticket.id}
                    initial={reducedMotion ? false : { opacity: 0, x: 20 }}
                    animate={
                      cleaned || reducedMotion
                        ? { opacity: 1, x: 0 }
                        : { opacity: 0.3, filter: 'blur(1px)' }
                    }
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-100">{ticket.title}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${ticket.badgeColor}`}
                      >
                        {ticket.urgency} ({ticket.urgencyScore})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-300 font-semibold">{ticket.wing}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">
                          {ticket.reportsMerged} {ticket.reportsMerged > 1 ? 'reports merged' : 'report'}
                        </span>
                      </div>
                      <span className="text-slate-300 font-medium">➡️ {ticket.assignee}</span>
                    </div>
                  </motion.div>
                );
              })}

              {/* Caption */}
              <div className="mt-auto pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="font-extrabold text-cyan-300 text-sm tracking-wide">
                  42 messages → 9 tickets → 5 minutes
                </span>

                <Link
                  href="/dashboard/import"
                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 group bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition-colors"
                >
                  <span>Committee: Import your WhatsApp chat (.txt)</span>
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
