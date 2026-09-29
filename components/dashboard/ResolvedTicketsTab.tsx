'use client';

import React, { useState } from 'react';
import { IComplaint } from '@/types';
import { formatDate, getUrgencyBadgeStyle } from '@/lib/utils';
import {
  CheckCircle2,
  Search,
  Filter,
  RotateCcw,
  Star,
  Clock,
  Calendar,
  Layers,
  Archive,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

interface ResolvedTicketsTabProps {
  complaints: IComplaint[];
  onSelectComplaint: (complaint: IComplaint) => void;
  onReopenComplaint: (complaintId: string) => void;
  includeArchived: boolean;
  onToggleArchived: (val: boolean) => void;
}

export default function ResolvedTicketsTab({
  complaints,
  onSelectComplaint,
  onReopenComplaint,
  includeArchived,
  onToggleArchived,
}: ResolvedTicketsTabProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [wingFilter, setWingFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Filter complaints client-side
  const filtered = complaints.filter((c) => {
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (wingFilter !== 'all' && c.wing !== wingFilter) return false;

    if (fromDate) {
      const cDate = new Date(c.resolvedAt || c.updatedAt);
      if (cDate < new Date(fromDate)) return false;
    }
    if (toDate) {
      const cDate = new Date(c.resolvedAt || c.updatedAt);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      if (cDate > end) return false;
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      const match =
        c.complaintId.toLowerCase().includes(s) ||
        c.summary.toLowerCase().includes(s) ||
        c.originalText.toLowerCase().includes(s) ||
        c.flatNumber.toLowerCase().includes(s) ||
        c.residentName.toLowerCase().includes(s);
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Controls & Filters Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10 space-y-3 bg-slate-900/40">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resolved complaints by ID, resident, flat, text..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Show Archived Checkbox */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 self-start sm:self-auto cursor-pointer">
            <input
              type="checkbox"
              id="includeArchived"
              checked={includeArchived}
              onChange={(e) => onToggleArchived(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
            />
            <label
              htmlFor="includeArchived"
              className="text-xs text-slate-300 font-medium cursor-pointer flex items-center gap-1.5"
            >
              <Archive className="w-3.5 h-3.5 text-slate-400" />
              Show Archived (&gt;30d)
            </label>
          </div>
        </div>

        {/* Dropdowns & Date Range */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-white/5 text-xs">
          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-slate-300 capitalize focus:outline-none"
          >
            <option value="all">All Categories</option>
            {['water', 'lift', 'parking', 'noise', 'cleaning', 'electrical', 'security', 'other'].map(
              (cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              )
            )}
          </select>

          {/* Wing */}
          <select
            value={wingFilter}
            onChange={(e) => setWingFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-slate-300 focus:outline-none"
          >
            <option value="all">All Wings</option>
            <option value="A">Wing A</option>
            <option value="B">Wing B</option>
            <option value="C">Wing C</option>
          </select>

          {/* From Date */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg px-2 py-1">
            <span className="text-[10px] text-slate-500">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-slate-300 text-[11px] focus:outline-none w-full"
            />
          </div>

          {/* To Date */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg px-2 py-1">
            <span className="text-[10px] text-slate-500">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-slate-300 text-[11px] focus:outline-none w-full"
            />
          </div>
        </div>
      </div>

      {/* Resolved Tickets Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden bg-black/20 shadow-xl">
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">
              Resolved & Closed Complaints ({filtered.length})
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Click row to view resolution timeline & notes
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
            <p>No resolved complaints found matching these filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-white/10 bg-white/[0.01]">
                <tr>
                  <th className="py-2.5 px-3">Complaint ID</th>
                  <th className="py-2.5 px-3">Summary</th>
                  <th className="py-2.5 px-3">Flat / Wing</th>
                  <th className="py-2.5 px-3">Resolution Time</th>
                  <th className="py-2.5 px-3">Resident Confirmation</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((c) => {
                  const resolvedDate = c.resolvedAt ? new Date(c.resolvedAt) : new Date(c.updatedAt);
                  const createdDate = new Date(c.createdAt);
                  const durationHours = Math.max(
                    0.5,
                    Math.round(((resolvedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60)) * 10) / 10
                  );

                  return (
                    <tr
                      key={c.complaintId}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                      onClick={() => onSelectComplaint(c)}
                    >
                      {/* ID */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-cyan-300">
                          {c.complaintId}
                        </span>
                        {c.archivedAt && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                            Archived
                          </span>
                        )}
                      </td>

                      {/* Summary */}
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-medium text-slate-200 truncate">{c.summary}</div>
                        <div className="text-[11px] text-slate-500 capitalize flex items-center gap-1.5">
                          <span>{c.category}</span>
                          <span>•</span>
                          <span>{c.residentName}</span>
                        </div>
                      </td>

                      {/* Flat */}
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {c.flatNumber}
                      </td>

                      {/* Resolution Time */}
                      <td className="py-3 px-3 text-slate-300">
                        <div className="flex items-center gap-1 font-medium text-emerald-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{durationHours}h turnaround</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {formatDate(c.resolvedAt || c.updatedAt)}
                        </div>
                      </td>

                      {/* Resident Confirmation */}
                      <td className="py-3 px-3">
                        {c.residentConfirmed === true ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <ThumbsUp className="w-3 h-3" /> Confirmed
                            {c.satisfactionRating && (
                              <span className="ml-1 text-amber-400">★{c.satisfactionRating}</span>
                            )}
                          </span>
                        ) : c.residentConfirmed === false ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                            <ThumbsDown className="w-3 h-3" /> Disputed
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            Awaiting feedback
                          </span>
                        )}
                      </td>

                      {/* Action: Reopen */}
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onReopenComplaint(c.complaintId)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Reopen and return to active triage queue"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reopen
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
