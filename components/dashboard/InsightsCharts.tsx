'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { IComplaint } from '@/types';
import { AlertTriangle, TrendingUp, CheckCircle, Flame, Building2 } from 'lucide-react';

interface InsightsProps {
  complaints: IComplaint[];
}

const CATEGORY_COLORS: Record<string, string> = {
  water: '#06b6d4',
  lift: '#8b5cf6',
  electrical: '#f59e0b',
  cleaning: '#10b981',
  parking: '#3b82f6',
  security: '#ef4444',
  noise: '#ec4899',
  other: '#64748b',
};

export default function InsightsCharts({ complaints }: InsightsProps) {
  // 1. Category Count
  const categoryCounts: Record<string, number> = {};
  complaints.forEach((c) => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });

  const categoryData = Object.entries(categoryCounts).map(([cat, count]) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    count,
    color: CATEGORY_COLORS[cat] || '#06b6d4',
  }));

  // 2. Trend data (Simulated past 7 days)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const trendData = days.map((day, idx) => ({
    day,
    reported: 2 + (idx % 3) * 2 + (idx === 6 ? 3 : 1),
    resolved: 1 + (idx % 2) * 2 + 1,
  }));

  // 3. Repeat-offender hotspots calculation
  const areaCounts: Record<string, number> = {};
  complaints.forEach((c) => {
    const key = c.commonArea || `Wing ${c.wing} Flat ${c.flatNumber}`;
    areaCounts[key] = (areaCounts[key] || 0) + (c.reportCount || 1);
  });

  const topHotspots = Object.entries(areaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top Repeat Offenders Alert Box */}
      <div className="glass-panel rounded-2xl p-5 border border-amber-500/30 bg-amber-950/20 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Repeat-Offender Hotspots (Recurring Society Issues)</span>
        </div>
        <p className="text-xs text-slate-300">
          AI detected recurring failures concentrated in specific assets requiring vendor escalation or capital repair:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {topHotspots.map(([loc, count], i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">{loc}</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                  {count} incidents
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {count > 2 ? '⚠️ High frequency recurrence' : 'Monitored area'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-100">Complaints by Category</h3>
            <span className="text-xs text-slate-400">Total: {complaints.length}</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Trend Line */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Weekly Inflow vs. Resolution Trend</span>
            </h3>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Reported
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Resolved
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="reported"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#06b6d4' }}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
