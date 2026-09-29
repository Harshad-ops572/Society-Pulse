'use client';

import React, { useState } from 'react';
import { IComplaint, ComplaintStatus } from '@/types';
import {
  formatDate,
  getSlaCountdown,
  getStatusBadgeStyle,
  getUrgencyBadgeStyle,
  timeAgo,
} from '@/lib/utils';
import {
  Search,
  Filter,
  Download,
  CheckCircle2,
  CopyCheck,
  Flame,
  ArrowUpDown,
  Building,
} from 'lucide-react';

interface PriorityQueueTableProps {
  complaints: IComplaint[];
  onSelectComplaint: (complaint: IComplaint) => void;
  onBulkResolve: (ids: string[]) => void;
  onBulkMerge: (ids: string[]) => void;
}

export default function PriorityQueueTable({
  complaints,
  onSelectComplaint,
  onBulkResolve,
  onBulkMerge,
}: PriorityQueueTableProps) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [filterWing, setFilterWing] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter complaints client-side
  const filtered = complaints.filter((c) => {
    if (filterCategory !== 'all' && c.category !== filterCategory) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterUrgency !== 'all' && c.urgency !== filterUrgency) return false;
    if (filterWing !== 'all' && c.wing !== filterWing) return false;
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

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((c) => c.complaintId));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden space-y-4 p-5">
      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search complaints, flat numbers, keywords..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="water">Water</option>
            <option value="lift">Lift</option>
            <option value="parking">Parking</option>
            <option value="noise">Noise</option>
            <option value="cleaning">Cleaning</option>
            <option value="electrical">Electrical</option>
            <option value="security">Security</option>
            <option value="other">Other</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="reopened">Reopened</option>
          </select>

          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 focus:outline-none"
          >
            <option value="all">All Urgency</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filterWing}
            onChange={(e) => setFilterWing(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 focus:outline-none"
          >
            <option value="all">All Wings</option>
            <option value="A">Wing A</option>
            <option value="B">Wing B</option>
            <option value="C">Wing C</option>
            <option value="D">Wing D</option>
          </select>

          {/* Export CSV Button */}
          <a
            href="/api/export"
            download
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when items selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-200">
          <span className="font-semibold">{selectedIds.length} complaints selected</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onBulkMerge(selectedIds)}
              className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold flex items-center gap-1"
            >
              <CopyCheck className="w-3.5 h-3.5" />
              <span>Merge As Duplicates</span>
            </button>
            <button
              type="button"
              onClick={() => onBulkResolve(selectedIds)}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Resolved</span>
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-2 px-2 w-8">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
                  onChange={toggleSelectAll}
                  className="rounded bg-black/40 border-white/20 text-cyan-500 focus:ring-0"
                />
              </th>
              <th className="py-2.5 px-3">Urgency & Score</th>
              <th className="py-2.5 px-3">Complaint ID</th>
              <th className="py-2.5 px-3">Summary & Issue</th>
              <th className="py-2.5 px-3">Flat & Wing</th>
              <th className="py-2.5 px-3">Age & SLA</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Assigned To</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-500 italic">
                  No complaints match current filters
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const uStyle = getUrgencyBadgeStyle(c.urgency);
                const sStyle = getStatusBadgeStyle(c.status);
                const sla = getSlaCountdown(c.slaDueAt);

                return (
                  <tr
                    key={c.complaintId}
                    onClick={() => onSelectComplaint(c)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(c.complaintId)}
                        onChange={() => toggleSelect(c.complaintId)}
                        className="rounded bg-black/40 border-white/20 text-cyan-500 focus:ring-0"
                      />
                    </td>

                    {/* Urgency Score */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${uStyle.bg} ${uStyle.border}`}
                        >
                          {c.urgency}
                        </span>
                        <span className="font-mono font-bold text-slate-300 text-[11px]">
                          {c.urgencyScore}
                        </span>
                        {c.isSafetyRisk && <Flame className="w-3.5 h-3.5 text-red-400" />}
                      </div>
                    </td>

                    {/* Complaint ID */}
                    <td className="py-3 px-3 font-mono font-bold text-cyan-300">
                      {c.complaintId}
                    </td>

                    {/* Summary */}
                    <td className="py-3 px-3 max-w-xs">
                      <p className="font-semibold text-slate-100 group-hover:text-cyan-200 transition-colors truncate">
                        {c.summary || c.originalText}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {c.originalText}
                      </p>
                    </td>

                    {/* Flat */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-semibold text-slate-200">
                        <Building className="w-3 h-3 text-cyan-400" />
                        <span>
                          {c.wing}-{c.flatNumber.replace(/[^0-9]/g, '')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">{c.residentName}</span>
                    </td>

                    {/* Age & SLA */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-slate-400 block">{timeAgo(c.createdAt)}</span>
                      {c.status !== 'resolved' && (
                        <span
                          className={`text-[10px] font-bold block ${
                            sla.isOverdue ? 'text-red-400' : 'text-slate-500'
                          }`}
                        >
                          {sla.text}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${sStyle.bg} ${sStyle.text}`}
                      >
                        {sStyle.label}
                      </span>
                    </td>

                    {/* Assignee */}
                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                      {c.assignedTo || <span className="text-slate-500 italic">Unassigned</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
