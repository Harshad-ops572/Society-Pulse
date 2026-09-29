'use client';

import React, { useState } from 'react';
import { IComplaint, ComplaintStatus } from '@/types';
import { getSlaCountdown, getUrgencyBadgeStyle } from '@/lib/utils';
import {
  Clock,
  AlertTriangle,
  User,
  Building,
  CheckCircle2,
  CopyCheck,
  ChevronRight,
  Flame,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface KanbanBoardProps {
  complaints: IComplaint[];
  onSelectComplaint: (complaint: IComplaint) => void;
  onUpdateStatus: (complaintId: string, nextStatus: ComplaintStatus) => void;
}

const COLUMNS: { id: ComplaintStatus; title: string; color: string }[] = [
  { id: 'new', title: 'New & Triaged', color: 'border-sky-500/40 text-sky-400' },
  { id: 'assigned', title: 'Assigned', color: 'border-violet-500/40 text-violet-400' },
  { id: 'in_progress', title: 'In Progress', color: 'border-amber-500/40 text-amber-400' },
  { id: 'resolved', title: 'Resolved (Last 24h)', color: 'border-emerald-500/40 text-emerald-400' },
];

export default function KanbanBoard({
  complaints,
  onSelectComplaint,
  onUpdateStatus,
}: KanbanBoardProps) {
  const [resolvedCollapsed, setResolvedCollapsed] = useState(true);
  const now = Date.now();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const isResolvedCol = col.id === 'resolved';

        const columnComplaints = complaints.filter((c) => {
          if (col.id === 'new') {
            return c.status === 'new' || c.status === 'triaged' || c.status === 'reopened';
          }
          if (col.id === 'resolved') {
            if (c.status !== 'resolved') return false;
            // Only show last 24 hours in Kanban resolved column
            const rTime = new Date(c.resolvedAt || c.updatedAt).getTime();
            return now - rTime <= 24 * 60 * 60 * 1000;
          }
          return c.status === col.id;
        });

        const isCollapsed = isResolvedCol && resolvedCollapsed;

        return (
          <div
            key={col.id}
            className={`glass-panel rounded-2xl p-4 border border-white/10 flex flex-col transition-all bg-black/20 ${
              isCollapsed ? 'h-[160px]' : 'h-[750px]'
            }`}
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between pb-3 border-b ${col.color} mb-3`}>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-100">{col.title}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-xs font-bold font-mono">
                  {columnComplaints.length}
                </span>
              </div>

              {isResolvedCol && (
                <button
                  type="button"
                  onClick={() => setResolvedCollapsed((prev) => !prev)}
                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                >
                  <span>{resolvedCollapsed ? 'Expand' : 'Collapse'}</span>
                  {resolvedCollapsed ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>

            {isCollapsed && (
              <div
                onClick={() => setResolvedCollapsed(false)}
                className="my-auto text-center cursor-pointer p-3 rounded-xl border border-dashed border-slate-700 hover:border-slate-500 text-slate-400 text-xs transition"
              >
                <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
                <span>{columnComplaints.length} resolved in last 24h</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Click to view or visit Resolved Tab</p>
              </div>
            )}

            {/* Complaints List in Column */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {columnComplaints.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-slate-500 text-xs italic">
                  No issues in this stage
                </div>
              ) : (
                columnComplaints.map((c) => {
                  const urgencyStyle = getUrgencyBadgeStyle(c.urgency);
                  const sla = getSlaCountdown(c.slaDueAt);

                  return (
                    <div
                      key={c.complaintId}
                      className="p-3.5 rounded-xl bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/30 transition-all shadow-md group cursor-pointer space-y-2.5"
                      onClick={() => onSelectComplaint(c)}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-300">
                          {c.complaintId}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {c.reportCount > 1 && (
                            <span
                              className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 text-[10px] font-bold flex items-center gap-0.5"
                              title={`${c.reportCount} reports merged`}
                            >
                              <CopyCheck className="w-3 h-3" />
                              <span>{c.reportCount}</span>
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${urgencyStyle.bg} ${urgencyStyle.border}`}
                          >
                            {c.urgency}
                          </span>
                        </div>
                      </div>

                      {/* Summary */}
                      <p className="text-xs font-semibold text-slate-100 leading-snug line-clamp-2">
                        {c.summary || c.originalText}
                      </p>

                      {/* Location & Reporter */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-medium">
                          <Building className="w-3 h-3 text-cyan-400" />
                          <span>
                            {c.wing}-{c.flatNumber.replace(/[^0-9]/g, '')}
                          </span>
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                          {c.category}
                        </span>
                      </div>

                      {/* SLA & Safety Alert */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                        {c.isSafetyRisk ? (
                          <span className="text-red-400 font-bold flex items-center gap-1 text-[10px]">
                            <Flame className="w-3 h-3" />
                            <span>Safety Hazard</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">{c.residentName}</span>
                        )}

                        {c.status !== 'resolved' ? (
                          <span
                            className={`flex items-center gap-1 font-bold text-[10px] ${
                              sla.isOverdue ? 'text-red-400' : 'text-slate-400'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{sla.text}</span>
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Done</span>
                          </span>
                        )}
                      </div>

                      {/* Move status shortcut pills */}
                      <div
                        className="pt-1 flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {col.id === 'new' && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(c.complaintId, 'assigned')}
                            className="text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 flex items-center gap-0.5"
                          >
                            <span>Assign</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                        {col.id === 'assigned' && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(c.complaintId, 'in_progress')}
                            className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 flex items-center gap-0.5"
                          >
                            <span>Start</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                        {col.id === 'in_progress' && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(c.complaintId, 'resolved')}
                            className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 flex items-center gap-0.5"
                          >
                            <span>Resolve</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
