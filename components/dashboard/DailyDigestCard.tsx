'use client';

import React from 'react';
import { IDigest, IDigestRow } from '@/types';
import { getUrgencyBadgeStyle } from '@/lib/utils';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  CopyCheck,
  CheckCircle2,
  ArrowRight,
  Flame,
  Check,
  Wrench,
} from 'lucide-react';

interface DailyDigestCardProps {
  digest: IDigest | null;
  onQuickAction: (complaintId: string, status: 'assigned' | 'in_progress' | 'resolved') => void;
  onSelectComplaint: (complaintId: string) => void;
}

export default function DailyDigestCard({
  digest,
  onQuickAction,
  onSelectComplaint,
}: DailyDigestCardProps) {
  if (!digest) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-white/10 animate-pulse text-slate-400 text-xs">
        Compiling AI Morning Digest...
      </div>
    );
  }

  const { stats, summaryHeadline, rows } = digest;

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-slate-900/60 to-violet-950/20 shadow-2xl relative overflow-hidden space-y-6">
      {/* Glow orb */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base sm:text-lg text-slate-100 tracking-tight">
                Today&apos;s 5-Minute AI Digest
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Live Briefing
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily morning triage summary for committee action
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 self-start sm:self-auto font-mono bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
          {digest.date}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block">
              Urgent Issues
            </span>
            <span className="text-2xl font-black text-red-300 mt-0.5 block">
              {stats.urgentCount}
            </span>
          </div>
          <Flame className="w-5 h-5 text-red-400 opacity-80" />
        </div>

        <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
              New Unassigned
            </span>
            <span className="text-2xl font-black text-sky-300 mt-0.5 block">
              {stats.newCount}
            </span>
          </div>
          <Clock className="w-5 h-5 text-sky-400 opacity-80" />
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              SLA Overdue
            </span>
            <span className="text-2xl font-black text-amber-300 mt-0.5 block">
              {stats.overdueCount}
            </span>
          </div>
          <AlertTriangle className="w-5 h-5 text-amber-400 opacity-80" />
        </div>

        <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-violet-400 uppercase tracking-wider block">
              Duplicates Merged
            </span>
            <span className="text-2xl font-black text-violet-300 mt-0.5 block">
              {stats.mergedDuplicatesCount}
            </span>
          </div>
          <CopyCheck className="w-5 h-5 text-violet-400 opacity-80" />
        </div>
      </div>

      {/* Summary Banner */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-cyan-500/20 text-xs text-slate-200 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed font-medium">{summaryHeadline}</span>
      </div>

      {/* Actionable Rows */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Priority Action Items (1-Tap Fast Actions)
        </span>

        <div className="space-y-2">
          {rows.map((row) => {
            const urgencyBadge = getUrgencyBadgeStyle(row.urgency);
            return (
              <div
                key={row.complaintId}
                className="p-3.5 rounded-xl bg-white/5 hover:bg-white/[0.08] border border-white/5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
              >
                <div
                  onClick={() => onSelectComplaint(row.complaintId)}
                  className="cursor-pointer space-y-1 flex-1"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-cyan-300 text-xs">
                      {row.complaintId}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${urgencyBadge.bg} ${urgencyBadge.border}`}
                    >
                      {row.urgency}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      Wing {row.wing} ({row.flatNumber})
                    </span>
                    {row.isSafetyRisk && (
                      <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-bold">
                        ⚠️ Safety
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-100 group-hover:text-cyan-200 transition-colors">
                    {row.summary}
                  </p>
                  <p className="text-[11px] text-slate-400 italic">
                    AI suggested: {row.suggestedAction}
                  </p>
                </div>

                {/* 1-Tap Quick Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => onQuickAction(row.complaintId, 'assigned')}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1 transition-colors"
                    title="Assign to technician"
                  >
                    <Wrench className="w-3 h-3 text-cyan-400" />
                    <span>Assign</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onQuickAction(row.complaintId, 'in_progress')}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold border border-amber-500/30 flex items-center gap-1 transition-colors"
                    title="Mark in progress"
                  >
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Start</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onQuickAction(row.complaintId, 'resolved')}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1 transition-colors"
                    title="Mark resolved"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Resolve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectComplaint(row.complaintId)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                    title="Open details"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
